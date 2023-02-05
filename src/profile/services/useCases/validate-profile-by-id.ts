export interface ValidateProfileById {
  validate(id: string): Promise<boolean>;
}
