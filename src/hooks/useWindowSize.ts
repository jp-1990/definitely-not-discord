import { useEffect, useState } from "react";

interface WidthHeight {
  width: number;
  height: number;
}

const useWindowSize = () => {
  const [dimensions, setDimensions] = useState<WidthHeight>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    dimensions,
  };
};

export default useWindowSize;
