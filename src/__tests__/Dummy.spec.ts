describe('Dummy test', () => {
  test('Just to satisfy compile', () => {
    const s = 'hello';
    expect(s).toMatchSnapshot();
  });
});
