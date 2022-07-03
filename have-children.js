const { React } = require("./React");

const AddNumbers = (props) => {
  const [total, setTotal] = React.useState(null);

  React.useEffect(() => {
    setTotal(props.number1 + props.number2);
  }, [props.number1, props.number2]);

  return {
    type: "div",
    inner: `${props.name} : ${props.number1} + ${props.number2} = ${total}`,
  };
};

const MultiplyNumbers = (props) => {
  const [total, setTotal] = React.useState(null);

  React.useEffect(() => {
    setTotal(props.number1 * props.number2);
  }, [props.number1, props.number2]);

  return {
    type: "div",
    inner: `${props.name} : ${props.number1} * ${props.number2} = ${total}`,
    children: [
      () =>
        React.component(AddNumbers, {
          name: "from multiply",
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

  return {
    type: "div",
    inner: `Add & multiply number ${count}`,
    children: [
      () =>
        React.component(AddNumbers, {
          name: "from component",
          number1: count,
          number2: number1,
        }),
      () =>
        React.component(MultiplyNumbers, {
          name: "from component",
          number1: count,
          number2: number2,
        }),
      () =>
        React.component(AddNumbers, {
          name: "from component again",
          number1: count + 1,
          number2: number1,
        }),
    ],
    click: () => setCount(count + 1),
  };
};

console.log("================================");
React.render(CompositeComponent);
console.log("================================");
React.providers[CompositeComponent][0].instance.click();
console.log("================================");
React.providers[CompositeComponent][0].instance.click();
console.log("================================");
React.providers[CompositeComponent][0].instance.click();
