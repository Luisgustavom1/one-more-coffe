const buttonAddCoffeeEl = document.querySelector('.add-coffee');
const todayCountsCoffeeEl = document.querySelector('.today-counting-coffees');
const yearCountsCoffeeEl = document.querySelector('.year-counting-coffees');

const vscode = acquireVsCodeApi();
const previousState = vscode.getState() || { coffeesToday: 0, coffeesInYear: 0 };

buttonAddCoffeeEl.addEventListener('click', function () {    
  const coffeesTodayUpdated =  previousState.coffeesToday + 1; 
  const coffeesInYearUpdated =  previousState.coffeesInYear + 1; 

  vscode.setState({ 
    coffeesToday: coffeesTodayUpdated, 
    coffeesInYear: coffeesInYearUpdated,
    date: new Date().toISOString() 
  });

  todayCountsCoffeeEl.textContent = coffeesTodayUpdated;
  yearCountsCoffeeEl.textContent = coffeesInYearUpdated;

  vscode.postMessage({
    command: "incrementCoffee"
  });
});