export type LoggerConfig =
	| {
			mode: "console";
	  }
	| {
			mode: "api";
			url: string;
	  };
