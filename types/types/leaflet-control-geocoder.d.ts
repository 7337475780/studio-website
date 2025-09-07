import * as L from "leaflet";

declare module "leaflet-control-geocoder" {
  interface GeocoderOptions {
    geocoder?: any;
  }

  class GeocoderControl extends L.Control {
    constructor(options?: GeocoderOptions);
    static nominatim(options?: any): any;
    on(event: string, callback: (e: any) => void): this;
  }

  const GeocoderControlDefault: typeof GeocoderControl;
  export default GeocoderControlDefault;
}
