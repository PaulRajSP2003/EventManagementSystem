const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  try {
    const hasTimezone = dateString.includes('Z') || /[+-]\d{2}(:?\d{2})?$/.test(dateString);
    const utcString = hasTimezone ? dateString : `${dateString}Z`;
    
    const date = new Date(utcString);

    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

  } catch (e) {
    return dateString;
  }
};

const input = "2026-03-19T21:20:19.47";
console.log(`Input: ${input}`);
console.log(`Output: ${formatDate(input)}`);

const inputWithZ = "2026-03-19T21:20:19.47Z";
console.log(`Input with Z: ${inputWithZ}`);
console.log(`Output: ${formatDate(inputWithZ)}`);

const inputWithOffset = "2026-03-20T02:50:19.47+05:30";
console.log(`Input with offset: ${inputWithOffset}`);
console.log(`Output: ${formatDate(inputWithOffset)}`);
