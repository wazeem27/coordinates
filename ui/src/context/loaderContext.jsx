import React, { useState } from "react";
export const LoaderContext = React.createContext(null);

export function LoaderProvider({ children }) {
    const [loader, setloader] = useState(false);
    return (
        <LoaderContext.Provider value={{ loader, setloader }}>
            {children}
        </LoaderContext.Provider>
    );
}