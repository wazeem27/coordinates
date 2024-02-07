import React from 'react';
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
    Button,
    IconButton
} from "@material-tailwind/react";
const Paginate = ({setCurrentPage , currentPage , itemsPerPage, totalItem }) => {

    const [active, setActive] = React.useState(1);

    const pageNumbers = [];

    const getItemProps = (index) =>
    ({
        variant: active === index ? "filled" : "text",
        color: "gray",
        onClick: () => setActive(index),
        className: "rounded-full",
    });

    const pagination = (pageNumber) => {
        console.log(pageNumber)
        setCurrentPage(pageNumber);
        setActive(pageNumber);
     };

    const next = () => {
        if (currentPage !== Math.ceil(currentPage.length / itemsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
        setActive(active + 1);
    };

    const prev = () => {
        if (currentPage !== 1) {
            setCurrentPage(currentPage - 1);
        }
        setActive(active - 1);
    };

 
    for (let i = 1; i <= Math.ceil(totalItem / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination-container mt-5">
            <div className="flex items-center gap-4" style={{justifyContent:"space-between"}}>
                <Button
                    variant="text"
                    className="flex items-center gap-2 rounded-full"
                    onClick={prev}
                    disabled={active === 1}

                >
                    <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" /> Previous
                </Button>
                <div className="flex items-center gap-2">
                    {pageNumbers.map((number) =>
                        <IconButton {...getItemProps(number)} onClick={() => pagination(number)}>{number}</IconButton>
                    )}
                </div>
                <Button
                    variant="text"
                    className="flex items-center gap-2 rounded-full"
                    onClick={next}
                    disabled={active === pageNumbers.length}
                >
                    Next
                    <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default Paginate;