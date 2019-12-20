import * as utils from "./utils";
import { setupEditData } from "./form/editData";
import { setupActions } from "./menu";
import { setupSidebar } from "./sidebar";
import { refreshScratchpadData } from "./patch";
import { setupMisc } from "./extend";
import { setupStates } from "./states/index";
import "./style.css";

export default function main (ui) {
  utils.init(ui);
  setupEditData();
  setupStates(ui);
  setupSidebar(ui);
  setupActions(ui);
  refreshScratchpadData(ui);
  setupMisc(ui);
}
