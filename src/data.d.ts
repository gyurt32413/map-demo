interface NearbyRenewalResponseData {
  result: NearbyRenewalResult[];
  tod: boolean;
}

interface NearbyRenewalResult {
  distance: number;
  id: number;
  is_tod: number;
  latitude: number;
  longitude: number;
  name: string;
  radius: number;
  stop_name: string;
}

interface PolygonResponseData {
  result: PolygonResult[];
}

interface PolygonResult {
  type: "FeatureCollection";
  name: string;
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: PolygonFeature[];
}

interface PolygonFeature {
  type: "Feature";
  properties: {
    TxtMemo: string;
    SHAPE_Area: number;
    分區: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: [number, number, number][][];
  };
}
