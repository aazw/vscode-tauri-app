declare module 'sql.js' {
  export interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): any[];
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(values?: any[]): void;
    step(): boolean;
    getAsObject(): any;
    get(): any[];
    run(values?: any[]): void;
    free(): void;
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<{
    Database: new (data?: Uint8Array) => Database;
  }>;
}