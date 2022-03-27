const { React, dispatchers } = require('./React');

const AddNumbers = props => {
  const [total, setTotal] = React.useState(null);

  React.useEffect(() => {
    setTotal(props.number1 + props.number2);
  }, [props.number1, props.number2]);

  return {
    type: "div",
    inner: `${props.number1} + ${props.number2} = ${total}`,
  }
}

const MultiplyNumbers = props => {
  const [total, setTotal] = React.useState(null);

  React.useEffect(() => {
    setTotal(props.number1 * props.number2)
  }, [props.number1, props.number2]);

  return {
    type: "div",
    inner: `${props.number1} * ${props.number2} = ${total}`,
  }
}

const CompositeComponent = () => {
  [count, setCount] = React.useState(0);
  [number1, setNumber1] = React.useState(2);
  [number2, setNumber2] = React.useState(5);

  return {
    type: "div",
    inner: `Add & multiply number ${count}`,
    children: [
      () => React.component(AddNumbers, { number1: count, number2: number1}),
      () => React.component(MultiplyNumbers, { number1: count, number2: number2}),
    ],
    click: () => setCount(count + 1),
  }
}

console.log('================================');
React.render(CompositeComponent)
console.log('================================');
dispatchers[0].instance.click();
console.log('================================');
dispatchers[0].instance.click();
console.log('================================');
dispatchers[0].instance.click();

