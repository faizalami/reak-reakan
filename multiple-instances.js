const { React, dispatchers } = require('./React');

const Component = props => {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('Steve');

  const exitThis = React.useEffect(() => {
    console.log('Name changed', name);
  }, [name])

  return {
    type: 'div',
    inner: `${count} ${props.unit} for ${name}`,
    click: () => setCount(count + 1),
    personArrived: (person) => setName(person),
    unsubscribe: () => exitThis()
  }
}

const MultiEffects = props => {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState('Steve');

  React.useEffect(() => {
    console.log('Count or name changed', count, name);
  }, [count, name]);

  React.useEffect(() => {
    console.log('Name changed', name);
  }, [name]);

  return {
    type: 'div',
    inner: `${count} ${props.unit} for ${name}`,
    click: () => setCount(count + 1),
    personArrived: (person) => setName(person),
  }
}


React.render(Component, { unit: 'likes' })
dispatchers[0].instance.click();
dispatchers[0].instance.click();
dispatchers[0].instance.personArrived('Peter');

console.log('================================');

React.render(Component, { unit: 'test' })
dispatchers[1].instance.click();
dispatchers[1].instance.personArrived('Jono');
dispatchers[1].instance.click();
dispatchers[1].instance.unsubscribe();

console.log('================================');

React.render(MultiEffects, { unit: 'multi effects' })
dispatchers[2].instance.click();
dispatchers[2].instance.personArrived('Peter');
dispatchers[2].instance.click();
