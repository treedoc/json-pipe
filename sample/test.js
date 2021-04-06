
console.log('hello')

const groupByGender = {};
function inc(num) {
  return num === undefined ? 1 : num+1;
}

module.exports = {
  filter(_) {
    return _.gender === 'Female';
  },
  map(_) {
    return {id: _.id+1, firstName: _.first_name.toUpperCase(), gender: _.gender};
  },
  aggregate(_) {
    if (_ === null)
      return groupByGender;
    groupByGender[_.gender] = inc(groupByGender[_.gender]);
  }
}
