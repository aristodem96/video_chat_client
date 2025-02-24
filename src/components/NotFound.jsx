import React, { useEffect } from "react";

const NotFound = () => {

    useEffect(() => {
        console.error('Error 404: Page not found!')
    }, [])

    return (
        <div className="not_found_container">
            NOT FOUND 404
        </div>
    )
}

export default NotFound;