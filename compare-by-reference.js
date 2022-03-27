const { React, dispatchers } = require('./React');

const NotChangeReference = () => {
  const [obj, setObj] = React.useState({ count: 0, name: 'Steve'});

  React.useEffect(() => {
    console.log('object changed', obj)
  }, [obj])

  return {
    type: "div",
    inner: `${obj.count} = ${obj.name}`,
    click: () => {
      const temp = obj;
      temp.count++;
      setObj(temp);
    },
    personArrived: (person) => {
      const temp = obj;
      temp.name = person;
      setObj(temp);
    },
  }
}


React.render(NotChangeReference);
dispatchers[0].instance.click();
dispatchers[0].instance.click();
dispatchers[0].instance.personArrived("Peter");

const ChangeReference = () => {
  const [obj, setObj] = React.useState({ count: 0, name: 'Steve'});

  React.useEffect(() => {
    console.log('object changed', obj)
  }, [obj])

  return {
    type: "div",
    inner: `${obj.count} = ${obj.name}`,
    click: () => setObj({...obj, count: obj.count + 1}),
    personArrived: (person) => setObj({...obj, name: person}),
  }
}

console.log('================================');

React.render(ChangeReference);
dispatchers[1].instance.click();
dispatchers[1].instance.click();
dispatchers[1].instance.personArrived("Peter");
