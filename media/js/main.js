const buttonAddCoffeeEl = document.querySelector('.add-coffee');
const todayCountsCoffeeEl = document.querySelector('.today-counting-coffees');
const yearCountsCoffeeEl = document.querySelector('.year-counting-coffees');

const vscode = acquireVsCodeApi();

buttonAddCoffeeEl.addEventListener('click', function () {    
  vscode.postMessage({
    command: "incrementCoffee"
  });
});