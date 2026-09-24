export interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  totalCopies: number;
  availableCopies: number;
}

export interface BookIssue {
  id: string;
  bookId: string;
  bookTitle?: string;
  studentId: string | null;
  teacherId: string | null;
  borrowerName?: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fine: number;
}
