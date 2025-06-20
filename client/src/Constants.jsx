import {
  FaUserCheck, FaWallet, FaFileSignature, FaBullhorn, FaHandshake, FaShoppingCart,
  FaChartLine, FaUsers, FaLightbulb, FaGavel, FaClipboardCheck, FaServer,
  FaDollarSign, FaUserCog, FaBriefcase, FaBoxOpen, FaMicrophone, FaCog,
  FaBuilding, FaTools, FaBatteryHalf, FaHome, FaDraftingCompass, FaUserFriends
} from "react-icons/fa";

// export const Server = "http://localhost:8080/api/v1"
export const Server = "https://icsq.onrender.com/api/v1"

export const capitalizeFirstLetter = (string) => {
    return (string?.charAt(0)?.toUpperCase() + string?.slice(1)) || string;
}

export const getDepartmentName = (id, departmentData) => {
  if (!id) return ""
  const department = departmentData.find(dept => dept._id === id);
  return department ? department.name : "";
};

export const getCategoryName = (id, categoryData)=>{
    const category = categoryData.find(dept => dept._id === id);
    return category ? category.name : "";
}

export const getTagandEmoji = (score)=>{
  if (score < 23){
    return {
      tag : "Detractor",
      emoji :"😞"
    }
  }
  if (score < 64){
    return {
      tag : "Passive",
      emoji :"😐"
    }
  }
  if (score <= 100){
    return {
      tag : "Promoter",
      emoji :"🙂"
    }
  }
}

export const getDepartmentIcon = (deptName) => {
  const departmentIcons = {
    "CRM": (<FaUserCheck className="inline-block mr-2 text-yellow-400" />),
    "COLLECTIONS":(<FaWallet className="inline-block mr-2 text-green-400" />),
    "DLD": (<FaFileSignature className="inline-block mr-2 text-blue-400" />),
    "MARKETING": (<FaBullhorn className="inline-block mr-2 text-pink-400" />),
    "MARKETING & CHANNEL RELATIONS": (<FaBullhorn className="inline-block mr-2 text-pink-400" />),
    "CHANNEL RELATIONS": (<FaHandshake className="inline-block mr-2 text-indigo-400" />),
    "SALES": (<FaShoppingCart className="inline-block mr-2 text-orange-400" />),
    "SALES OPERATIONS": <FaChartLine className="inline-block mr-2 text-teal-400" />,
    "HR & ADMINISTRATION": <FaUsers className="inline-block mr-2 text-purple-400" />,
    "LEGAL": <FaGavel className="inline-block mr-2 text-gray-400" />,
    "AUDIT": <FaClipboardCheck className="inline-block mr-2 text-green-300" />,
    "IT": <FaServer className="inline-block mr-2 text-blue-300" />,
    "FINANCE & ACCOUNTS": <FaDollarSign className="inline-block mr-2 text-green-500" />,
    "PEOPLE DEVELOPMENT": <FaUserCog className="inline-block mr-2 text-pink-500" />,
    "MD OFFICE": <FaBriefcase className="inline-block mr-2 text-gray-300" />,
    "PROCUREMENT": <FaBoxOpen className="inline-block mr-2 text-[goldenrod]" />,
    "PUBLIC RELATIONS": <FaMicrophone className="inline-block mr-2 text-red-400" />,
    "PROCESS IMPROVEMENT & BUSINESS EXCELLENCE": <FaCog className="inline-block mr-2 text-blue-500" />,
    "DEVELOPMENT": <FaBuilding className="inline-block mr-2 text-gray-400" />,
    "SOBHAPMC LLC": <FaTools className="inline-block mr-2 text-indigo-500" />,
    "SOBHA ENERGY SOLUTION": <FaBatteryHalf className="inline-block mr-2 text-green-400" />,
    "LATINEM FACILITIES MANAGEMENT": <FaHome className="inline-block mr-2 text-blue-400" />,
    "PNCA": <FaDraftingCompass className="inline-block mr-2 text-[goldenrod]" />,
    "SOBHA COMMUNITY MANAGEMENT LLC": <FaUserFriends className="inline-block mr-2 text-purple-400" />,
  };
  return (departmentIcons[deptName.toUpperCase()] || <FaBuilding className="inline-block mr-2 text-gray-400"/>);
}
