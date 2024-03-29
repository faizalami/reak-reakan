const { React } = require('./React');

const Component = (props) => {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('Steve');

  const exitThis = React.useEffect(() => {
    console.log('Name changed', name);
  }, [name]);

  /**
   * return (
   *  <div onClick={() => setCount(count + 1)} onPersonArrived={(person) => setName(person)}>
   *    {`${count} ${props.unit} for ${name}`}
   *  </div>
   * )
   */
  return {
    type: 'div',
    inner: `${count} ${props.unit} for ${name}`,
    click: () => setCount(count + 1),
    personArrived: (person) => setName(person),
    unsubscribe: () => exitThis(),
  };
};

const MultiEffects = (props) => {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('Steve');

  React.useEffect(() => {
    console.log('Count or name changed', count, name);
  }, [count, name]);

  React.useEffect(() => {
    console.log('Name changed', name);
  }, [name]);

  /**
   * return (
   *  <div onClick={() => setCount(count + 1)} onPersonArrived={(person) => setName(person)}>
   *    {`${count} ${props.unit} for ${name}`}
   *  </div>
   * )
   */
  return {
    type: 'div',
    inner: `${count} ${props.unit} for ${name}`,
    click: () => setCount(count + 1),
    personArrived: (person) => setName(person),
  };
};

React.render(Component, { unit: 'likes' });
React.dispatchers[Component][0].instance.click();
React.dispatchers[Component][0].instance.click();
React.dispatchers[Component][0].instance.personArrived('Peter');

console.log('================================');

React.render(Component, { unit: 'test' });
React.dispatchers[Component][1].instance.click();
React.dispatchers[Component][1].instance.personArrived('Jono');
React.dispatchers[Component][1].instance.click();
React.dispatchers[Component][1].instance.unsubscribe();

console.log('================================');

React.render(MultiEffects, { unit: 'multi effects' });
React.dispatchers[MultiEffects][0].instance.click();
React.dispatchers[MultiEffects][0].instance.personArrived('Peter');
React.dispatchers[MultiEffects][0].instance.click();
