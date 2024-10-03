// ===--- Abstract Functions ---===

// 'a * 'a array -> 'a
// Mutates arr by removing the first instance of val (if any).
function removeVal(val, arr) {
  const idx = arr.findIndex(x => x === val);
  if (idx >= 0) return arr.splice(idx, 1);
}

// 'a array -> 'a array array
/* Returns each possible pairing of elements in arr (ignoring order 
variations), without creating duplicates. */
const subPairs = (arr) => {
  const pairs = [];
  arr.keys().forEach(itemOneIdx => {
    arr.slice(itemOneIdx + 1).forEach(itemTwo => {
      pairs.push([arr[itemOneIdx], itemTwo]);
    })
  })
  return pairs;
}

// 'a array * int -> 'a array array
/* Returns an array of every n-length combination of elements in arr (ignoring 
element order variations), without creating duplicates. */
function subPermutations(arr, n) {
  if (n < 0 || n > arr.length) {
    throw Error(`Bad argument: getPermutations called with n=${n}.\
    n must be between 0 and arr.length.`);
  }  
  switch (n) { 
    case arr.length: 
      return [arr];
    case 0: 
      return [];
    case 1: 
      return arr.map(item => [item]);
    default: {
      const pairs = subPairs(arr); 
      if (n === 2) { 
        return pairs; 
      } else { 
        const combine = (subs) => {
          const newSubs = [];
          const subTailIdx = subs[0].length - 1;
          subs.forEach(subArray => {
            const subTail = subArray[subTailIdx];
            const pairsToUse = pairs.filter(pair => pair[0] === subTail);
            pairsToUse.forEach(pair => newSubs.push(subArray.concat(pair[1])));
          });

          if (newSubs[0].length === n) { 
            return newSubs;
          } else {
            return combine(newSubs); 
          }
        }

        return combine(pairs);
      }   
    }  
  }
}

export { removeVal, subPermutations };
