import * as vscode from 'vscode';
import { OneMoreCoffeeState } from './model';

const STATE_KEYS = {
	'oneMoreCoffee': 'oneMoreCoffee'
};

export class OneMoreCoffeeStateStorage {

	constructor(
    private globalState: vscode.ExtensionContext['globalState']
  ) {}

	public get(): OneMoreCoffeeState {
		return this.globalState.get(STATE_KEYS.oneMoreCoffee) ?? {
			coffeesInYear: 0,
			coffeesToday: 0,
		};
	}

	public update(state: Partial<OneMoreCoffeeState>) {
		this.globalState.update(STATE_KEYS.oneMoreCoffee, {
			...this.get(),
			...state,
		});
	}
}