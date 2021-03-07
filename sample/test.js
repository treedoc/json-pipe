
console.log('hello')

module.exports = {
  filter(_) {
    return _.gender === 'Male';
  },
  map(_) {
    return {id: _.id+1, firstName: _.first_name.toUpperCase()};
  }
}
