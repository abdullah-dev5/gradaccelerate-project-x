const { DateTime } = require('luxon');

console.log('=== TESTING TIMEZONE CONVERSION ===');

// Test the exact logic from our backend
const testDate = '2025-09-18 18:14:00';
console.log('Input from DB:', testDate);

// Backend normalization logic
const withT = testDate.replace(' ', 'T');
const normalized = withT.endsWith('Z') ? withT : withT + 'Z';
console.log('Normalized by backend:', normalized);

// Frontend parsing logic
const dtUtc = DateTime.fromISO(normalized, { zone: 'utc' });
console.log('Parsed as UTC:', dtUtc.toISO());

// Convert to local timezone
const local = dtUtc.setZone('Asia/Karachi');
const output = local.toFormat('MMM dd, yyyy, hh:mm a');
console.log('Final display:', output);
console.log('Expected: Sep 18, 2025, 11:14 PM');

// Test with different formats
console.log('\n=== TESTING DIFFERENT FORMATS ===');
const formats = [
  '2025-09-18 18:14:00',
  '2025-09-18T18:14:00.000Z',
  '2025-09-18T18:14:00.000+05:00'
];

formats.forEach(format => {
  console.log(`\nTesting: ${format}`);
  let dt;
  if (format.includes(' ') && !format.includes('T')) {
    const iso = format.replace(' ', 'T') + 'Z';
    dt = DateTime.fromISO(iso, { zone: 'utc' });
  } else if (format.includes('+') || format.includes('-')) {
    dt = DateTime.fromISO(format).toUTC();
  } else {
    dt = DateTime.fromISO(format, { zone: 'utc' });
  }
  const local = dt.setZone('Asia/Karachi');
  console.log(`Result: ${local.toFormat('MMM dd, yyyy, hh:mm a')}`);
});
