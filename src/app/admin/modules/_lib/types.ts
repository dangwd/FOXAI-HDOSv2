export interface ModuleForm {
  code:        string;
  name:        string;
  description: string;
}

export const BLANK_FORM: ModuleForm = {
  code: "", name: "", description: "",
};
