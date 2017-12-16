import {BlockModel} from "../../../model/BlockModel";

export class Classes
{
	public block: BlockModel;

	activate(block: BlockModel) {
		this.block = block;
	}
}