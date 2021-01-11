
console.log('hello')

module.exports = {
  filter() {
    return _.gender === 'Male';
  },
  map() {
    return {id: _.id+1, firstName: _.first_name.toUpperCase()};
  }
}
