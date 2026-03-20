const { addBusinessDays } = require('date-fns');
console.log("Start");
try {
  console.log(addBusinessDays(new Date(), NaN));
} catch(e) {
  console.log("Error:", e.message);
}
console.log("End");
