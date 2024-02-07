import React, { useState } from "react";
export const ToasterContext = React.createContext(null);

export function ToasterProvider({ children }) {
    const [toast, showtoast] = useState(false);
    const [alertType, setalertType] = useState({});
    return (
        <ToasterContext.Provider value={{ toast, showtoast , alertType , setalertType}}>
            {children}
        </ToasterContext.Provider>
    );
}