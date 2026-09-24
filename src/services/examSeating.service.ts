import { supabase } from '@/lib/supabase';

export interface ExamRoom {
  id: string;
  name: string;
  capacity: number;
}

export interface SeatAssignment {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  sectionName: string;
  roomId: string;
  roomName: string;
  seatNumber: number;
}

export async function listExamRooms(schoolId: string): Promise<ExamRoom[]> {
  const { data, error } = await supabase.from('exam_rooms').select('*').eq('school_id', schoolId).order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, capacity: r.capacity }));
}

export async function createExamRoom(schoolId: string, name: string, capacity: number): Promise<void> {
  const { error } = await supabase.from('exam_rooms').insert({ school_id: schoolId, name, capacity });
  if (error) throw error;
}

export async function deleteExamRoom(id: string): Promise<void> {
  const { error } = await supabase.from('exam_rooms').delete().eq('id', id);
  if (error) throw error;
}

export async function listSeatingForExam(examId: string): Promise<SeatAssignment[]> {
  const { data, error } = await supabase
    .from('exam_seating_assignments')
    .select('*, students(first_name, last_name, classes(name), sections(name)), exam_rooms(name)')
    .eq('exam_id', examId)
    .order('seat_number');
  if (error) throw error;
  return (data ?? []).map((r) => {
    const student = (r as unknown as { students: { first_name: string; last_name: string; classes: { name: string } | null; sections: { name: string } | null } }).students;
    const room = (r as unknown as { exam_rooms: { name: string } }).exam_rooms;
    return {
      id: r.id,
      studentId: r.student_id,
      studentName: `${student.first_name} ${student.last_name}`,
      className: student.classes?.name ?? '',
      sectionName: student.sections?.name ?? '',
      roomId: r.room_id,
      roomName: room.name,
      seatNumber: r.seat_number,
    };
  });
}

export async function getMySeatForExam(examId: string, studentId: string): Promise<SeatAssignment | null> {
  const all = await listSeatingForExam(examId);
  return all.find((a) => a.studentId === studentId) ?? null;
}

export interface MySeatAssignment extends SeatAssignment {
  examId: string;
  examName: string;
}

// For a student's (or their parent's) own view — every seat assignment
// they have across all exams, most recent exam first. RLS already
// restricts this to the student's own rows or their parent's child, so
// no extra filtering is needed here.
export async function listMySeatAssignments(studentId: string): Promise<MySeatAssignment[]> {
  const { data, error } = await supabase
    .from('exam_seating_assignments')
    .select('*, exams(name), exam_rooms(name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const exam = (r as unknown as { exams: { name: string } }).exams;
    const room = (r as unknown as { exam_rooms: { name: string } }).exam_rooms;
    return {
      id: r.id,
      examId: r.exam_id,
      examName: exam?.name ?? 'Exam',
      studentId: r.student_id,
      studentName: '',
      className: '',
      sectionName: '',
      roomId: r.room_id,
      roomName: room?.name ?? '',
      seatNumber: r.seat_number,
    };
  });
}

// Generates a fresh seating plan for the exam: every student in every
// class/section that has a paper scheduled for this exam, shuffled
// within each class and then interleaved round-robin across classes, so
// consecutive seat numbers land on different classes as often as
// possible. Any previous seating for this exam is replaced.
export async function generateSeating(schoolId: string, examId: string, roomIds: string[]): Promise<{ seated: number; unseated: number }> {
  if (roomIds.length === 0) throw new Error('Select at least one room.');

  const { data: examSubjects, error: esError } = await supabase
    .from('exam_subjects')
    .select('class_id, section_id')
    .eq('exam_id', examId);
  if (esError) throw esError;

  const classSectionPairs = Array.from(new Set((examSubjects ?? []).map((r) => `${r.class_id}|${r.section_id}`))).map((key) => {
    const [classId, sectionId] = key.split('|');
    return { classId, sectionId };
  });
  if (classSectionPairs.length === 0) {
    throw new Error('No classes are scheduled for this exam yet — add exam subjects first.');
  }

  const { data: students, error: sError } = await supabase
    .from('students')
    .select('id, class_id, section_id')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .in(
      'class_id',
      classSectionPairs.map((p) => p.classId)
    );
  if (sError) throw sError;

  // Group by class+section, restricted to pairs actually sitting this exam.
  const validPairs = new Set(classSectionPairs.map((p) => `${p.classId}|${p.sectionId}`));
  const groups = new Map<string, string[]>();
  (students ?? [])
    .filter((s) => validPairs.has(`${s.class_id}|${s.section_id}`))
    .forEach((s) => {
      const key = `${s.class_id}|${s.section_id}`;
      const list = groups.get(key) ?? [];
      list.push(s.id);
      groups.set(key, list);
    });

  // Shuffle within each class group so it's not always the same
  // roll-number order, then interleave round-robin across groups.
  const groupLists = Array.from(groups.values()).map((list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  });

  const interleaved: string[] = [];
  let remaining = groupLists.reduce((sum, g) => sum + g.length, 0);
  while (remaining > 0) {
    for (const g of groupLists) {
      const next = g.shift();
      if (next) {
        interleaved.push(next);
        remaining--;
      }
    }
  }

  const { data: rooms, error: rError } = await supabase.from('exam_rooms').select('*').in('id', roomIds).order('name');
  if (rError) throw rError;

  const assignments: { school_id: string; exam_id: string; room_id: string; student_id: string; seat_number: number }[] = [];
  let cursor = 0;
  for (const room of rooms ?? []) {
    for (let seat = 1; seat <= room.capacity && cursor < interleaved.length; seat++) {
      assignments.push({ school_id: schoolId, exam_id: examId, room_id: room.id, student_id: interleaved[cursor], seat_number: seat });
      cursor++;
    }
  }

  await supabase.from('exam_seating_assignments').delete().eq('exam_id', examId);
  if (assignments.length > 0) {
    const { error: insertError } = await supabase.from('exam_seating_assignments').insert(assignments);
    if (insertError) throw insertError;
  }

  return { seated: assignments.length, unseated: interleaved.length - assignments.length };
}
