function extractTimers(text) {
  const regex = /(\d+)\s*(min|h|sec)(?:ute)?(?:eure)?s?(?:\s*(\d+))?/gi;
  const timers = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const val1 = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const val2 = match[3] ? parseInt(match[3], 10) : 0;
    
    if (unit === 'h') {
      timers.push(val1 * 60 + val2);
    } else if (unit.startsWith('min')) {
      timers.push(val1);
    } else if (unit.startsWith('sec')) {
      timers.push(val1 / 60); 
    }
  }
  return timers;
}

console.log(extractTimers("Faire cuire au four pendant 20 min."));
console.log(extractTimers("Laisser reposer 1 h 30 au frais."));
console.log(extractTimers("Cuire 1h puis laisser 10 minutes."));
console.log(extractTimers("Environ 45 minutes de cuisson."));
