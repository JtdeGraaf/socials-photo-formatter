declare module 'piexifjs' {
  export type PiexifData = Record<string, Record<string, unknown>>;

  export function load(jpegDataUrl: string): PiexifData;
  export function dump(data: PiexifData): string;
  export function insert(exifStr: string, jpegDataUrl: string): string;

  const piexif: {
    load: typeof load;
    dump: typeof dump;
    insert: typeof insert;
  };

  export default piexif;
}

