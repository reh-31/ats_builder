import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeData } from "../types";

// Single-column, plain-text layout on purpose: ATS parsers reliably extract
// text from simple flowed layouts but often fail on tables/columns/images.
// NOTE on lineHeight: @react-pdf resolves a unitless lineHeight against the
// fontSize declared in the SAME style object (falling back to 18 if absent),
// not the inherited page fontSize. Every style using lineHeight must therefore
// also declare its fontSize explicitly, or the text renders double-spaced.
const BODY_SIZE = 10;

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: BODY_SIZE,
    fontFamily: "Helvetica",
    color: "#111111"
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2, textAlign: "center" },
  contactLine: { fontSize: 8, marginBottom: 8, color: "#333333", textAlign: "center" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#999999",
    paddingBottom: 2
  },
  summary: { fontSize: BODY_SIZE, marginBottom: 2, lineHeight: 1.35 },
  skillsLine: { fontSize: BODY_SIZE, lineHeight: 1.4 },
  entry: { marginBottom: 5 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 4,
    marginBottom: 1
  },
  entryTitle: { fontFamily: "Helvetica-Bold", flex: 1, paddingRight: 12 },
  entryDates: { fontSize: 9, color: "#333333", flexShrink: 0, paddingTop: 1 },
  entrySubtitle: { fontSize: 9.5, fontFamily: "Helvetica-Oblique", marginBottom: 2 },
  bulletRow: { flexDirection: "row", marginLeft: 6, marginBottom: 1.5 },
  bulletGlyph: { width: 8, fontSize: BODY_SIZE, lineHeight: 1.3 },
  bulletText: { flex: 1, fontSize: BODY_SIZE, lineHeight: 1.3 }
});

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletGlyph}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export function ResumePDF({ resume }: { resume: ResumeData }) {
  const contactParts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.website
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{resume.contact.name}</Text>
        <Text style={styles.contactLine}>{contactParts.join(" | ")}</Text>

        {resume.summary && (
          <>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{resume.summary}</Text>
          </>
        )}

        {resume.skills?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <Text style={styles.skillsLine}>{resume.skills.join("  •  ")}</Text>
          </>
        )}

        {resume.experience?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {resume.experience.map((job, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {job.title} — {job.company}
                  </Text>
                  <Text style={styles.entryDates}>
                    {job.startDate} – {job.endDate}
                  </Text>
                </View>
                {job.location && !job.company.includes(job.location) && (
                  <Text style={styles.entrySubtitle}>{job.location}</Text>
                )}
                {job.bullets.map((b, j) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </>
        )}

        {resume.education?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((ed, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {ed.degree} — {ed.school}
                  </Text>
                  <Text style={styles.entryDates}>
                    {ed.startDate} – {ed.endDate}
                  </Text>
                </View>
                {ed.location && !ed.school.includes(ed.location) && (
                  <Text style={styles.entrySubtitle}>{ed.location}</Text>
                )}
                {ed.details?.map((d, j) => (
                  <Bullet key={j}>{d}</Bullet>
                ))}
              </View>
            ))}
          </>
        )}

        {resume.projects && resume.projects.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((p, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {p.name}
                    {p.link ? ` — ${p.link}` : ""}
                  </Text>
                </View>
                {p.description && <Text style={styles.entrySubtitle}>{p.description}</Text>}
                {p.bullets?.map((b, j) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </>
        )}

        {resume.certifications && resume.certifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {resume.certifications.map((c, i) => (
              <Bullet key={i}>{c}</Bullet>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
