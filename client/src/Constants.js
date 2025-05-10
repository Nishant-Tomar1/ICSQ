export const Server = "http://localhost:8080/api/v1"

export const capitalizeFirstLetter = (string) => {
    return (string.charAt(0).toUpperCase() + string.slice(1)) || string;
}

export const getDepartmentName = (id, departmentData) => {
    return departmentData.map((dept) => dept._id === id ? dept.name : "")
}