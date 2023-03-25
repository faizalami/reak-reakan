const { React } = require('./React');

const AddNumbers = (props) => {
  const [total, setTotal] = React.useState(null);

  React.useEffect(() => {
    setTotal(props.number1 + props.number2);
  }, [props.number1, props.number2]);

  /**
   * return (
   *  <div>
   *    {`${props.name} : ${props.number1} + ${props.number2} = ${total}`}
   *  </div>
   * )
   */
  return {
    type: 'div',
    inner: `${props.name} : ${props.number1} + ${props.number2} = ${total}`,
  };
};

const MultiplyNumbers = (props) => {
  const [total, setTotal] = React.useState(null);

  React.useEffect(() => {
    setTotal(props.number1 * props.number2);
  }, [props.number1, props.number2]);

  /**
   * return (
   *  <div>
   *    {`${props.name} : ${props.number1} * ${props.number2} = ${total}`}
   *    <AddNumbers name="from multiply" number1={total} number2={props.number1} />
   *  </div>
   * )
   */
  return {
    type: 'div',
    inner: `${props.name} : ${props.number1} * ${props.number2} = ${total}`,
    children: [
      () =>
        React.component(AddNumbers, {
          name: 'from multiply (add)',
          number1: total,
          number2: props.number1,
        }),
    ],
  };
};

const CompositeComponent = () => {
  [count, setCount] = React.useState(0);
  [number1, setNumber1] = React.useState(2);
  [number2, setNumber2] = React.useState(5);

  /**
   * return (
   *  <div onClick={() => setCount(count + 1)}>
   *    {`Add & multiply number ${count}`}
   *    <AddNumbers name="from component" number1={count} number2={number1} />
   *    <MultiplyNumbers name="from component" number1={count} number2={number2} />
   *    <AddNumbers name="from component again" number1={count + 1} number2={number1} />
   *  </div>
   * )
   */
  return {
    type: 'div',
    inner: `Add & multiply number ${count}`,
    children: [
      () =>
        React.component(AddNumbers, {
          name: 'from container (add)',
          number1: count,
          number2: number1,
        }),
      () =>
        React.component(MultiplyNumbers, {
          name: 'from container (multiply)',
          number1: count,
          number2: number2,
        }),
      () =>
        React.component(AddNumbers, {
          name: 'from container again (add)',
          number1: count + 1,
          number2: number1,
        }),
    ],
    click: () => setCount(count + 1),
  };
};

console.log('================================');
React.render(CompositeComponent);
console.log('================================');

/**
 * Add & multiply number 0
 * from container (add) : 0 + 2 = 2
 * from container (multiply) : 0 * 5 = 0
 * from multiply (add) : 0 + 0 = 0
 * from container again (add) : 1 + 2 = 3
 */
React.dispatchers[CompositeComponent][0].instance.click();
console.log('================================');

/**
 * Add & multiply number 1
 * from container (add) : 1 + 2 = 3
 * from container (multiply) : 1 * 5 = 5
 * from multiply (add) : 5 + 1 = 6
 * from container again (add) : 2 + 2 = 4
 */
React.dispatchers[CompositeComponent][0].instance.click();
console.log('================================');

/**
 * Add & multiply number 2
 * from container (add) : 2 + 2 = 4
 * from container (multiply) : 2 * 5 = 10
 * from multiply (add) : 10 + 2 = 12
 * from container again (add) : 3 + 2 = 5
 */
React.dispatchers[CompositeComponent][0].instance.click();
