import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 14 },
  logo: { width: 36, height: 36, marginBottom: 4, alignSelf: 'center', objectFit: 'contain' },
  schoolName: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  reportTitle: { fontSize: 10, color: '#555' },
  table: { borderWidth: 1, borderColor: '#ccc' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tableHeaderCell: { flex: 1, padding: 4, fontWeight: 700, backgroundColor: '#f0f0f0' },
  tableCell: { flex: 1, padding: 4 },
  footer: { position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: '#999' },
});

export function TableReportPdf({
  title,
  schoolName,
  schoolLogoUrl,
  headers,
  rows,
}: {
  title: string;
  schoolName: string;
  schoolLogoUrl: string | null;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          {schoolLogoUrl && <Image src={schoolLogoUrl} style={styles.logo} />}
          <Text style={styles.schoolName}>{schoolName}</Text>
          <Text style={styles.reportTitle}>{title}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            {headers.map((h, i) => (
              <Text key={i} style={styles.tableHeaderCell}>{h}</Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              {row.map((cell, j) => (
                <Text key={j} style={styles.tableCell}>{String(cell)}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.footer} fixed>Powered by AURAED SCHOOL</Text>
      </Page>
    </Document>
  );
}
