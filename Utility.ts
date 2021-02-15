export function mergeTypedArrays(a: any, b: any) {
    // Checks for truthy values on both arrays
    if (!a && !b) throw "Please specify valid arguments for parameters a and b.";
  
    // Checks for truthy values or empty arrays on each argument
    // to avoid the unnecessary construction of a new array and
    // the type comparison
    if (!b || b.length === 0) return a;
    if (!a || a.length === 0) return b;
  
    // Make sure that both typed arrays are of the same type
    if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b))
      throw "The types of the two arguments passed for parameters a and b do not match.";
  
    var c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
  
    return c;
  }
  
 export function uint8arrayToStringMethod(uint8arr: any, callback: (str: any) => void) {
    var bb = new Blob([uint8arr]);
    var f = new FileReader();
    f.onload = function (e) {
      callback(e.target.result);
    };
  
    f.readAsText(bb);
  }
  