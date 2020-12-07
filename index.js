import React, { useEffect, useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import { Datasheet } from "../components/Datasheet";
import { Button } from "../components/SexyButton";
import { Row, Container } from "../components/Grid";
import { Pagination } from "../components/Pagination";
import { EditableCell } from "../components/EditableCell";
import { MOCK_EMPLOYEES } from "./mocks";
import { Search } from "../components/Search";
import { useSearch } from "../hooks/useSearch";
import { schema } from "../validation/schema";
import styles from "./employees.module.scss";

const cloneMockEmployees = cloneDeep(MOCK_EMPLOYEES);

const Employees = () => {
    const [page, setPageNumber] = useState(0);
    const [count, setPageCount] = useState(10);
    const [from, setFrom] = useState(0);
    const [until, setUntil] = useState(10);
    const [searchVal, setSearchVal] = useState(null);
    const [updated, setUpdated] = useState([]);
    const [selected, setSelected] = useState([]);
    const [deleted, setDeleted] = useState([]);
    const [baseData, setBaseData] = useState(cloneMockEmployees);
    const [employees, setEmployees] = useState(cloneMockEmployees);
    const { filteredData, loading } = useSearch({
        searchVal,
        retrieve: baseData.data,
    });

    useEffect(() => {
        setEmployees({
            pagination: {
                total: filteredData.length,
                pages: Number(filteredData.length / employees.pagination.limit),
                page: 1,
                limit: 10,
            },
            data: filteredData,
        });
    }, [filteredData, setEmployees]);

    const handleEmployeesTable = (evt, idx) => {
        let item = {
            id: Number(evt.target.id),
            name: evt.target.name,
            value: evt.target.value,
        };

        const val = {
            [evt.target.name]: evt.target.value,
        };

        schema.validate(val, { abortEarly: false }).catch(e => {
            console.error(e.errors);
        });

        // Update field in table row
        const newData = [...employees.data];
        newData[idx] = {...newData[idx], [item.name]: item.value};
        setBaseData(prevState => ({
            ...prevState,
            data: newData,
        }));

        // Add updated field to "updated" array
        const exist = updated.some(e => e.id === item.id);
        if (!exist) {
            setUpdated(updated => [...updated, newData[idx]]);
        } else {
            if (item.value == MOCK_EMPLOYEES.data[idx][item.name]) {
                setUpdated(updated.filter(x => x.id !== item.id));
            }
        }
    };

    const handleSelect = id => {
        const checkExist = selected.filter(empId => {
            return empId === id;
        });

        if (checkExist.length === 0) {
            setSelected(selected => [...selected, id]);
        } else {
            setSelected(selected.filter(x => x !== id));
        }
    };

    const handleDelete = () => {
        const existSelectedIds = updated.filter(id => selected.includes(id));
        setUpdated(updated.filter(id => !existSelectedIds.includes(id)));
        setDeleted(selected);
    };

    const handleUndo = () => {
        setDeleted([]);
    };

    const viewJsonData = () => {
        // const updatedData = employees.data.filter(emp => updated.includes(emp.id));
        // const deletedData = employees.data.filter(emp => deleted.includes(emp.id));
        console.log("updated: ", JSON.stringify(updated, null, 2));
        console.log("deleted: ", JSON.stringify(deleted, null, 2));
    };

    const handleSearch = e => {
        setSearchVal(e.target.value);
    };

    const handleResetData = () => {
        setBaseData(cloneDeep(MOCK_EMPLOYEES));
        setUpdated([]);
        setSelected([]);
        setDeleted([]);
    };

    function renderTable() {
        return (
            <>
                <Datasheet
                    columns={[
                        {
                            name: "check",
                            renderFn: (row, idx) => {
                                return (
                                    <input
                                        type="checkbox"
                                        onClick={() => {
                                            handleSelect(row.id);
                                        }}
                                    />
                                );
                            },
                        },
                        {
                            name: "id",
                            header: "ID",
                            style: { width: "50px" },
                        },
                        {
                            name: "name",
                            header: "Name",
                            renderFn: (row, idx) => {
                                return (
                                    <EditableCell
                                        onEmployeesTableUpdate={e => handleEmployeesTable(e, idx)}
                                        cellData={{
                                            fieldName: "name",
                                            employee: row,
                                        }}
                                    />
                                );
                            },
                        },
                        {
                            name: "surname",
                            header: "Surname",
                            renderFn: (row, idx) => {
                                return (
                                    <EditableCell
                                        onEmployeesTableUpdate={e => handleEmployeesTable(e, idx)}
                                        cellData={{
                                            fieldName: "surname",
                                            employee: row,
                                        }}
                                    />
                                );
                            },
                        },
                        {
                            name: "dateOfBirth",
                            header: "Date of birth",
                            renderFn: (row, idx) => {
                                return (
                                    <EditableCell
                                        onEmployeesTableUpdate={e => handleEmployeesTable(e, idx)}
                                        cellData={{
                                            fieldType: "date",
                                            fieldName: "dateOfBirth",
                                            employee: row,
                                        }}
                                    />
                                );
                            },
                        },
                        {
                            name: "position",
                            header: "Position",
                            renderFn: (row, idx) => {
                                return (
                                    <EditableCell
                                        onEmployeesTableUpdate={e => handleEmployeesTable(e, idx)}
                                        cellData={{
                                            fieldName: "position",
                                            employee: row,
                                        }}
                                    />
                                );
                            },
                        },
                        {
                            name: "phoneNumber",
                            header: "Phone number",
                            renderFn: (row, idx) => {
                                return (
                                    <EditableCell
                                        onEmployeesTableUpdate={e => handleEmployeesTable(e, idx)}
                                        cellData={{
                                            fieldType: "tel",
                                            fieldName: "phoneNumber",
                                            employee: row,
                                        }}
                                    />
                                );
                            },
                        },
                    ]}
                    data={employees.data.filter(emp => !deleted.includes(emp.id)).slice(from, until)}
                    showHeader={true}
                    isLoading={loading}
                />
            </>
        );
    }

    return (
        <Container>
            <div className={styles.paddedTitle}>
                <div className={styles.title}>
                    <h1>Employees</h1>
                </div>
            </div>
            <Row>
                <Search onChange={handleSearch} />
                <div className={styles.buttons}>
                    <Button outline feel="primary" onClick={handleResetData}>
                        Reset Data
                    </Button>
                    <Button feel="primary" onClick={viewJsonData}>
                        Submit
                    </Button>
                </div>
            </Row>
            {employees && renderTable()}
            <div className={styles.buttons}>
                <Button condensed feel="primary" onClick={handleDelete}>
                    Delete
                </Button>
                <Button condensed feel="normal" onClick={handleUndo}>
                    Undo
                </Button>
            </div>
            <Pagination
                defaultItemsCountPerPage={count}
                totalItemsCount={employees && employees.pagination.total}
                onPageChange={(offset, limit) => {
                    const page = offset / count;
                    const from = 0 + count * page;
                    const until = count + count * page;
                    const c = Number(limit);
                    setPageNumber(page);
                    setPageCount(c);
                    setFrom(from);
                    setUntil(until);
                }}
                currentPage={page + 1}
            />
        </Container>
    );
};

export default Employees;
