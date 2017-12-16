import * as _ from 'lodash';
import {BlockModel} from "./BlockModel";
import {Blocks} from "../blocks";

// bm = document.querySelector('[au-target-id]').au.controller.scope.bindingContext.view.blocksModel
// air = bm.getBlockByName('air')
export class BlocksModel {
	private doc: Document;

	public view: Blocks;

	public blocks = [];

	public errors: string[] = [];

	// new drop schema
	public dropSchema = {
		'event': {
			name: 'event',
			required: true,
			value: '',
			error: '',
		}
	};

	// new class schema
	public classSchema = {
		'name': {
			name: 'name',
			required: true,
			value: '',
			error: '',
		}
	};

	// new property schema is dynamic
	public propertySchema = {};

	constructor(doc: Document, view: Blocks) {
		this.doc = doc;
		this.view = view;
		this.loadBlocks();
	}

	public loadBlocks() {
		_.each(this.doc.documentElement.childNodes, (element: Element) => {
			if (element.tagName == 'block') {
				this.blocks.push(new BlockModel(this.doc, element, this));
			}
		});
	}

	public addError(error: string) {
		if (_.indexOf(this.errors, error) < 0) {
			this.errors.push(error);
		}
	}

	public getBlockByName(name: string) {
		let i = this.getBlockIndexByName(name);
		if (i) {
			return this.blocks[i];
		}
	}

	private getBlockIndexByName(name: string) {
		for (let i in this.blocks) {
			let block = this.blocks[i];
			if (block.name == name) {
				return i;
			}
		}
	}

}