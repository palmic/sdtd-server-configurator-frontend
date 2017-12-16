import {BlockModel} from "../../../model/BlockModel";

export class Properties
{
	public block: BlockModel;

	activate(block: BlockModel) {
		this.block = block;
	}
}