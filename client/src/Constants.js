export const Server = "http://localhost:8080/api/v1"

export const capitalizeFirstLetter = (string) => {
    return (string?.charAt(0)?.toUpperCase() + string?.slice(1)) || string;
}

export const getDepartmentName = (id, departmentData) => {
  const department = departmentData.find(dept => dept._id === id);
  return department ? department.name : "";
};

export const getCategoryName = (id, categoryData)=>{
    const category = categoryData.find(dept => dept._id === id);
    return category ? category.name : "";
}