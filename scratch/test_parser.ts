
import { parseCell } from '../src/utils/parser';
import type { SubjectInfo } from '../src/types';

const examples = [
  "Math (Advanced) (John) @ Room 101",
  "English (Smith) @ A1",
  "MT (Mathematics) (Doe) @ Lab 1",
  "JustSubject @ Room 2",
  "Subject (Teacher) No Room"
];

console.log("Testing parseCell:");
examples.forEach(ex => {
  console.log(`\nInput: "${ex}"`);
  console.log(JSON.stringify(parseCell(ex), null, 2));
});

// Simulate migration logic
console.log("\n--- Simulating Migration Logic ---");

const simulateMigration = (info: SubjectInfo) => {
  // FIXED LOGIC: Only re-parse if teacher and classroom are missing
  if (!info.teacher && !info.classroom && (info.subject.includes('(') || info.subject.includes('@'))) {
    const reParsed = parseCell(info.subject);
    if (reParsed && (reParsed.teacher || reParsed.classroom)) {
      return { ...info, ...reParsed };
    }
  }
  return info;
};

const firstExample = "Math (Advanced) (John) @ Room 101";
const parsed = parseCell(firstExample);
console.log(`\nInitial Parse of "${firstExample}":`);
console.log(JSON.stringify(parsed, null, 2));

if (parsed) {
  const migrated = simulateMigration(parsed);
  console.log("\nAfter Migration (FIXED LOGIC):");
  console.log(JSON.stringify(migrated, null, 2));
}
