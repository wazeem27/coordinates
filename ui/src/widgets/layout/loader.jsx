import {Spinner} from "@material-tailwind/react";
const loaderComponent = () => {
    return (
        <div>
            <div className="absolute" style={{ top: 0, left: 0, width: "100%", height: "100%", background: "#00000021", zIndex: "99" }}>
                <div className="absolute" style={{ position: "absolute", top: "50%", left: "50%", }}><Spinner className="h-16 w-16 text-gray-900/50" /></div>
            </div>
        </div>
    )
}

export default loaderComponent;