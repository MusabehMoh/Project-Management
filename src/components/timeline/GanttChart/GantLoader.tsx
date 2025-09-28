import React, { useState, useEffect } from "react";

const GoogleChartLoader = ({ children }: { children: any }) => {
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (window.google && window.google.charts) {
      window.google.charts.load("current", { packages: ["gantt"] });
      window.google.charts.setOnLoadCallback(() => setGoogleReady(true));
    } else {
      const script = document.createElement("script");

      script.src = "https://www.gstatic.com/charts/loader.js";
      script.id = "googleChartsScript";
      script.onload = () => {
        window.google.charts.load("current", { packages: ["gantt"] });
        window.google.charts.setOnLoadCallback(() => setGoogleReady(true));
      };
      document.head.appendChild(script);
    }

    return () => {
      const script = document.getElementById("googleChartsScript");

      if (script) document.head.removeChild(script);
    };
  }, []);

  return googleReady ? children : <div>Loading Google Charts...</div>;
};

export default GoogleChartLoader;
