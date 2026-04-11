import { useEffect, useState } from "react";
import axios from "axios";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import lib_books from "../../assets/lib-books.svg";
import { BACKEND_URL } from "@/config/env";

const fieldClass =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm ring-offset-background transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const AddCoursePane = (args) => {
  const [queriedCourses, setQueriedCourses] = useState([]);
  const [courseQuery, setCourseQuery] = useState({
    course_query: "",
    branch: "",
    semester: "",
  });
  const [courseQueryTimeoutId, setcourseQueryTimeoutId] = useState(null);

  useEffect(() => {
    axios
      .post(
        `${BACKEND_URL}/api/queryCourses`,
        {
          course_query: courseQuery.course_query,
          branch: courseQuery.branch,
          semester: courseQuery.semester,
        },
        { withCredentials: true }
      )
      .then((res) => {
        setQueriedCourses(res.data);
      })
      .catch(() => {
        alert("An error occured. Couldn't query for courses.");
      });
  }, [courseQuery]);

  const handleAddCourseButtonOnClick = (_id) => {
    axios
      .post(
        `/api/addToEnrolledCourses`,
        { _id },
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        if (res.data.message) {
          alert("Course is already enrolled in.");
        } else {
          args.setEnrolledCourses([...args.enrolledCourses, res.data]);
          alert("Course added!");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("An error occured. Couldn't complete request.");
      });
  };

  function handleSemesterChange(event) {
    setCourseQuery({
      ...courseQuery,
      semester: event.target.value,
    });
  }

  function handleBranchChange(event) {
    setCourseQuery({
      ...courseQuery,
      branch: event.target.value,
    });
  }

  function handleCourseQueryChange(event) {
    debounceCourseQuery(() => {
      setCourseQuery({
        ...courseQuery,
        course_query: event.target.value,
      });
    }, 700);
  }

  const debounceCourseQuery = (func, delay) => {
    clearTimeout(courseQueryTimeoutId);
    const id = setTimeout(func, delay);
    setcourseQueryTimeoutId(id);
  };

  return (
    <div className="min-h-full">
      <div className="border-b border-border bg-background/60 px-4 py-5 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="course-query"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60"
            >
              Search
            </label>
            <input
              className={fieldClass}
              type="text"
              name="course-query"
              id="course-query"
              placeholder="Search for a course"
              onChange={handleCourseQueryChange}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 sm:w-40">
              <label
                htmlFor="semester"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60"
              >
                Semester
              </label>
              <select
                className={fieldClass}
                id="semester"
                name="semester"
                onChange={handleSemesterChange}
              >
                <option value="semester">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
            </div>
            <div className="min-w-0 flex-1 sm:min-w-[280px]">
              <label
                htmlFor="branch"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60"
              >
                Branch
              </label>
              <select
                className={fieldClass}
                id="branch"
                name="branch"
                onChange={handleBranchChange}
              >
                <option value="branch">Any branch</option>
                <option value="CSE">Computer Science and Engineering</option>
                <option value="DS">Computer Science Data Science</option>
                <option value="ECE">
                  Electronics and Communications Engineering
                </option>
                <option value="EE">Electrical Engineering</option>
                <option value="ME">Mechanical Engineering</option>
                <option value="CE">Civil Engineering</option>
                <option value="PIE">Production Engineering</option>
                <option value="META">Metallurgical Engineering</option>
                <option value="AERO">Aerospace Engineering</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {queriedCourses.map((course) => (
            <div
              key={course._id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition group-hover:bg-primary/20">
                    <img
                      className="h-6 w-6 opacity-80"
                      src={lib_books}
                      alt=""
                    />
                  </div>
                  <div className="truncate font-semibold text-foreground">
                    {course.id}
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="shrink-0 rounded-full border-border"
                  onClick={() => handleAddCourseButtonOnClick(course._id)}
                  aria-label={`Add ${course.id}`}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-1 flex-col gap-2 px-5 py-4 text-sm text-foreground/75">
                <div>
                  <span className="text-foreground/50">Topic</span>{" "}
                  <span className="text-foreground">{course.name}</span>
                </div>
                <div>
                  <span className="text-foreground/50">Branch</span>{" "}
                  <span className="text-foreground">{course.branch}</span>
                </div>
                <div>
                  <span className="text-foreground/50">Semester</span>{" "}
                  <span className="text-foreground">{course.semester}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddCoursePane;
