const { React } = require("./React");

const NotChangeReference = () => {
  const [obj, setObj] = React.useState({ count: 0, name: "Steve" });

  React.useEffect(() => {
    console.log("object changed", obj);
  }, [obj]);

  /**
   * return (
   *  <div
   *    onClick={() => {
   *      const temp = obj;
   *      temp.count++;
   *      setObj(temp);
   *    }}
   *    onPersonArrived={(person) => {
   *      const temp = obj;
   *      temp.name = person;
   *      setObj(temp);
   *    }}>
   *    {`${obj.count} = ${obj.name}`}
   *  </div>
   * )
   */
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
  };
};

React.render(NotChangeReference);
React.dispatchers[NotChangeReference][0].instance.click();
React.dispatchers[NotChangeReference][0].instance.click();
React.dispatchers[NotChangeReference][0].instance.personArrived("Peter");

const ChangeReference = () => {
  const [obj, setObj] = React.useState({ count: 0, name: "Steve" });

  React.useEffect(() => {
    console.log("object changed", obj);
  }, [obj]);

  /**
   * return (
   *  <div onClick={() => setObj({ ...obj, count: obj.count + 1 })} onPersonArrived={(person) => setObj({ ...obj, name: person })}>
   *    {`${obj.count} = ${obj.name}`}
   *  </div>
   * )
   */
  return {
    type: "div",
    inner: `${obj.count} = ${obj.name}`,
    click: () => setObj({ ...obj, count: obj.count + 1 }),
    personArrived: (person) => setObj({ ...obj, name: person }),
  };
};

console.log("================================");

React.render(ChangeReference);
React.dispatchers[ChangeReference][0].instance.click();
React.dispatchers[ChangeReference][0].instance.click();
React.dispatchers[ChangeReference][0].instance.personArrived("Peter");
