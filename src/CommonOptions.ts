export interface CommonOptions {
  /** The backend URL (e.g. `staging-nginz-https.zinfra.io`) */
  backendURL?: string;
  /** The default backend URL (e.g. `staging-nginz-https.zinfra.io`) */
  defaultBackendURL: string;
  /** Don't send any data (beside logging in and out) */
  dryRun?: boolean;
  /** Your Wire email address */
  emailAddress?: string;
  /** Your Wire password */
  password?: string;
}
