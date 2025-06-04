class WizardForm {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 4;
    this.formData = {
      personalInfo: {},
      credentials: {},
      projects: []
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDropzones();
    this.setupSkillsSelector();
    this.updateUI();
    this.createToastContainer();
  }

  createToastContainer() {
    if (!document.getElementById("toastContainer")) {
      const toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
      toastContainer.style.zIndex = "9999";
      document.body.appendChild(toastContainer);
    }
  }

  showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");
    const toastId = "toast-" + Date.now();
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <i class="ph-duotone ${type === "success" ? "ph-check-circle" : "ph-warning-circle"} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    toastContainer.insertAdjacentHTML("beforeend", toastHtml);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay: 4000
    });
    toast.show();

    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove();
    });
  }

  setupEventListeners() {
    document.getElementById("nextBtn").addEventListener("click", () => this.nextStep());
    document.getElementById("prevBtn").addEventListener("click", () => this.prevStep());
    document.getElementById("firstBtn").addEventListener("click", () => this.goToStep(0));
    document.getElementById("finishBtn").addEventListener("click", () => this.goToStep(3));

    document.querySelectorAll(".nav-link").forEach((tab, index) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        if (index < this.totalSteps) {
          this.goToStep(index);
        }
      });
    });

    document.getElementById("addProjectBtn").addEventListener("click", () => this.openProjectModal());
    document.getElementById("saveProjectBtn").addEventListener("click", () => this.saveProject());

    document.getElementById("phoneNumber").addEventListener("input", (e) => this.validatePhoneNumber(e));
    document.getElementById("termsCheck").addEventListener("change", () => this.updateFinishButton());
    document.getElementById("submitProfile").addEventListener("click", () => this.submitProfile());

    document.getElementById("fullName").addEventListener("input", (e) => this.validateField(e.target, "required"));
    document.getElementById("phoneNumber").addEventListener("input", (e) => this.validatePhoneNumber(e));

    const emailField = document.getElementById("email");
    if (emailField) {
      emailField.addEventListener("input", (e) => this.validateEmail(e));
    }

    const currentProjectCheckbox = document.getElementById("currentProject");
    if (currentProjectCheckbox) {
      currentProjectCheckbox.addEventListener("change", (e) => {
        const endDateInput = document.getElementById("projectEndDate");
        endDateInput.disabled = e.target.checked;
        if (e.target.checked) {
          endDateInput.value = "";
        }
      });
    }
  }

  validateField(field, validationType) {
    const value = field.value.trim();
    let isValid = true;
    let message = "";

    switch (validationType) {
      case "required":
        isValid = value !== "";
        message = `${field.getAttribute("data-label") || "This field"} is required`;
        break;
      case "minLength":
        const minLength = parseInt(field.getAttribute("data-min-length")) || 2;
        isValid = value.length >= minLength;
        message = `Must be at least ${minLength} characters long`;
        break;
    }

    if (!isValid) {
      this.showFieldError(field, message);
    } else {
      this.clearFieldError(field);
    }
    return isValid;
  }

  validateEmail(e) {
    const value = e.target.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      this.showFieldError(e.target, "Please enter a valid email address");
      return false;
    } else {
      this.clearFieldError(e.target);
      return true;
    }
  }

  showFieldError(field, message) {
    field.classList.add("is-invalid");
    let feedback = field.nextElementSibling;
    if (!feedback || !feedback.classList.contains("invalid-feedback")) {
      feedback = document.createElement("div");
      feedback.className = "invalid-feedback";
      field.parentNode.appendChild(feedback);
    }
    feedback.textContent = message;
  }

  clearFieldError(field) {
    field.classList.remove("is-invalid");
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains("invalid-feedback")) {
      feedback.remove();
    }
  }

  setupDropzones() {
    const docDropzone = document.getElementById("documentDropzone");
    const docInput = document.getElementById("documentFiles");
    if (docDropzone && docInput) {
      docDropzone.addEventListener("click", () => docInput.click());
      docDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        docDropzone.classList.add("dragover");
      });
      docDropzone.addEventListener("dragleave", () => {
        docDropzone.classList.remove("dragover");
      });
      docDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        docDropzone.classList.remove("dragover");
        this.handleFileUpload(e.dataTransfer.files, "uploadedFiles");
      });
      docInput.addEventListener("change", (e) => {
        this.handleFileUpload(e.target.files, "uploadedFiles");
      });
    }

    const certDropzone = document.getElementById("certificationDropzone");
    const certInput = document.getElementById("certificationFiles");
    if (certDropzone && certInput) {
      certDropzone.addEventListener("click", () => certInput.click());
      certDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        certDropzone.classList.add("dragover");
      });
      certDropzone.addEventListener("dragleave", () => {
        certDropzone.classList.remove("dragover");
      });
      certDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        certDropzone.classList.remove("dragover");
        this.handleFileUpload(e.dataTransfer.files, "uploadedCertifications");
      });
      certInput.addEventListener("change", (e) => {
        this.handleFileUpload(e.target.files, "uploadedCertifications");
      });
    }
  }

  setupSkillsSelector() {
    const skillsCheckboxes = document.querySelectorAll('#skillsList input[type="checkbox"]');
    skillsCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.addSkillTag(e.target.value);
        } else {
          this.removeSkillTag(e.target.value);
        }
      });
    });
  }

  addSkillTag(skill) {
    const selectedSkillsContainer = document.getElementById("selectedSkills");
    if (!selectedSkillsContainer) return;

    // Prevent duplicate tags
    if (selectedSkillsContainer.querySelector(`[data-skill="${skill}"]`) !== null) {
      return;
    }

    const skillTag = document.createElement("span");
    skillTag.className = "skill-tag";
    skillTag.setAttribute("data-skill", skill);
    skillTag.innerHTML = `
      ${skill}
      <button type="button" class="remove-skill" data-skill="${skill}">×</button>
    `;
    skillTag.querySelector(".remove-skill").addEventListener("click", () => {
      this.removeSkillTag(skill);
      const checkbox = document.querySelector(`#skillsList input[value="${skill}"]`);
      if (checkbox) checkbox.checked = false;
    });
    selectedSkillsContainer.appendChild(skillTag);
  }

  removeSkillTag(skill) {
    const selectedSkillsContainer = document.getElementById("selectedSkills");
    if (!selectedSkillsContainer) return;
    const skillTag = selectedSkillsContainer.querySelector(`[data-skill="${skill}"]`);
    if (skillTag) {
      skillTag.remove();
    }
  }

  handleFileUpload(files, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        this.showToast(`File "${file.name}" is not a supported format. Please upload PDF, Word, or Image files.`, "warning");
        return;
      }
      if (file.size > maxFileSize) {
        this.showToast(`File "${file.name}" is too large. Maximum size allowed is 5MB.`, "warning");
        return;
      }

      const fileElement = document.createElement("span");
      fileElement.className = "uploaded-file";
      fileElement.innerHTML = `
        <i class="ph-duotone ph-file me-1"></i>
        ${file.name} <small class="text-muted">(${this.formatFileSize(file.size)})</small>
        <button type="button" class="remove-file">×</button>
      `;
      fileElement.querySelector(".remove-file").addEventListener("click", () => {
        fileElement.remove();
      });
      container.appendChild(fileElement);
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  validatePhoneNumber(e) {
    const field = e.target;
    let value = field.value;
    const numbersOnly = value.replace(/\D/g, "");
    field.value = numbersOnly;

    if (numbersOnly.length < 11 && numbersOnly.length > 0) {
      this.showFieldError(field, "Phone number must be at least 11 digits");
      return false;
    } else if (numbersOnly.length > 15) {
      this.showFieldError(field, "Phone number cannot exceed 15 digits");
      return false;
    } else if (value !== numbersOnly) {
      this.showFieldError(field, "Phone number should contain only numbers");
      return false;
    } else {
      this.clearFieldError(field);
      return true;
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Overridden nextStep() so that it POSTS or PATCHes via fetch
  // ────────────────────────────────────────────────────────────
  nextStep() {
    if (!this.validateCurrentStep()) return;

    const formId = this.getCurrentFormId();
    const form = document.querySelector(formId);
    if (!form) {
      // If no form on this step (e.g. final or error), just advance
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
        this.updateUI();
      }
      return;
    }

    // We expect each form to have a hidden input named "_method" whose value is "POST" or "PATCH"
    const methodInput = form.querySelector('input[name="_method"]');
    if (!methodInput) {
      console.error(`Form ${formId} is missing <input name="_method">.`);
      return;
    }

    const formData = new FormData(form);
    const url = form.action;

    fetch(url, {
      method: methodInput.value, // "POST" first time, then switched to "PATCH"
      body: formData
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        this.showToast("Step submitted successfully!", "success");
        // On first success, switch that form’s method to PATCH
        methodInput.value = "PATCH";

        // Locally save the data
        this.saveCurrentStepData();

        // Advance to next step if not on last
        if (this.currentStep < this.totalSteps - 1) {
          this.currentStep++;
          this.updateUI();
        }
      })
      .catch((error) => {
        this.showToast("Error submitting step. Please try again.", "danger");
        console.error("Form submission error:", error);
      });
  }

  // ────────────────────────────────────────────────────────────
  //  Overridden prevStep() so it restores data when going back
  // ────────────────────────────────────────────────────────────
  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateUI();
      this.restoreStepData();
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Return the selector (ID) of the form for the current step
  // ────────────────────────────────────────────────────────────
  getCurrentFormId() {
    switch (this.currentStep) {
      case 0:
        return "#personalInfoForm";
      case 1:
        return "#credentialsForm";
      case 2:
        return "#projectsForm";
      default:
        return null;
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Fill the form fields from this.formData when going back
  // ────────────────────────────────────────────────────────────
  restoreStepData() {
    switch (this.currentStep) {
      case 0: {
        const pi = this.formData.personalInfo;
        if (pi.fullName !== undefined) {
          document.getElementById("fullName").value = pi.fullName;
        }
        if (pi.phoneNumber !== undefined) {
          document.getElementById("phoneNumber").value = pi.phoneNumber;
        }
        if (pi.email !== undefined && document.getElementById("email")) {
          document.getElementById("email").value = pi.email;
        }
        // (If you want to re-render uploaded-files visually, you'd need extra code here.)
        break;
      }
      case 1: {
        const credentials = this.formData.credentials;
        if (credentials.skills) {
          // Re-check the checkboxes
          document.querySelectorAll('#skillsList input[type="checkbox"]').forEach((input) => {
            input.checked = credentials.skills.includes(input.value);
          });
          // Clear and re-create skill tags
          document.getElementById("selectedSkills").innerHTML = "";
          credentials.skills.forEach((skill) => this.addSkillTag(skill));
        }
        // (If you want to re-render uploadedCertifications visually, add code here.)
        break;
      }
      case 2: {
        // Just re-render the projects grid:
        this.renderProjects();
        break;
      }
      default:
        break;
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Validate the current wizard step (delegates to validateStep)
  // ────────────────────────────────────────────────────────────
  validateCurrentStep() {
    return this.validateStep(this.currentStep);
  }

  validateStep(stepIndex) {
    switch (stepIndex) {
      case 0: {
        let isValid = true;
        const fullName = document.getElementById("fullName").value.trim();
        const phoneNumber = document.getElementById("phoneNumber").value.trim();
        const emailField = document.getElementById("email");

        if (!fullName) {
          this.showFieldError(document.getElementById("fullName"), "Full name is required");
          isValid = false;
        }
        if (fullName && fullName.length < 2) {
          this.showFieldError(document.getElementById("fullName"), "Full name must be at least 2 characters");
          isValid = false;
        }
        if (!phoneNumber) {
          this.showFieldError(document.getElementById("phoneNumber"), "Phone number is required");
          isValid = false;
        }
        if (phoneNumber && (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10)) {
          this.showFieldError(document.getElementById("phoneNumber"), "Please enter a valid phone number (at least 10 digits)");
          isValid = false;
        }
        if (emailField && emailField.value.trim()) {
          if (!this.validateEmail({ target: emailField })) {
            isValid = false;
          }
        }
        return isValid;
      }
      case 1: {
        const selectedSkills = document.querySelectorAll("#selectedSkills .skill-tag");
        if (selectedSkills.length === 0) {
          this.showToast("Please select at least one skill", "warning");
          return false;
        }
        return true;
      }
      case 2:
        // No mandatory fields in Projects step (projects can be empty)
        return true;
      case 3: {
        const termsCheck = document.getElementById("termsCheck");
        if (!termsCheck.checked) {
          this.showToast("Please accept the terms and conditions to continue", "warning");
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Gather values from inputs and store them in this.formData
  // ────────────────────────────────────────────────────────────
  saveCurrentStepData() {
    switch (this.currentStep) {
      case 0: {
        const emailField = document.getElementById("email");
        this.formData.personalInfo = {
          fullName: document.getElementById("fullName").value.trim(),
          email: emailField ? emailField.value.trim() : "",
          phoneNumber: document.getElementById("phoneNumber").value.trim(),
          documents: Array.from(document.querySelectorAll("#uploadedFiles .uploaded-file")).map((el) =>
            el.textContent.replace("×", "").trim()
          )
        };
        break;
      }
      case 1: {
        this.formData.credentials = {
          skills: Array.from(document.querySelectorAll("#selectedSkills .skill-tag")).map((el) =>
            el.textContent.replace("×", "").trim()
          ),
          certifications: Array.from(document.querySelectorAll("#uploadedCertifications .uploaded-file")).map((el) =>
            el.textContent.replace("×", "").trim()
          )
        };
        break;
      }
      case 2:
        // Projects got pushed into this.formData.projects already via saveProject()
        break;
    }
  }

  openProjectModal() {
    const modalEl = document.getElementById("projectModal");
    if (!modalEl) {
      console.error("No element with id=\"projectModal\" found.");
      return;
    }
    const modal = new bootstrap.Modal(modalEl);
    this.clearProjectForm();
    modal.show();
  }

  clearProjectForm() {
    const form = document.getElementById("projectForm");
    if (!form) return;
    form.reset();
    document.getElementById("projectEndDate").disabled = false;
    document.querySelectorAll("#projectModal .is-invalid").forEach((field) => {
      field.classList.remove("is-invalid");
    });
    document.querySelectorAll("#projectModal .invalid-feedback").forEach((fb) => {
      fb.remove();
    });
  }

  saveProject() {
    const form = document.getElementById("projectForm");
    if (!form) return;

    const title = document.getElementById("projectTitle").value.trim();
    const description = document.getElementById("projectDescription").value.trim();
    const startDate = document.getElementById("projectStartDate").value;
    const endDate = document.getElementById("projectEndDate").value;
    const isCurrentProject = document.getElementById("currentProject").checked;

    let isValid = true;
    if (!title) {
      this.showFieldError(document.getElementById("projectTitle"), "Project title is required");
      isValid = false;
    }
    if (!description) {
      this.showFieldError(document.getElementById("projectDescription"), "Project description is required");
      isValid = false;
    }
    if (!startDate) {
      this.showFieldError(document.getElementById("projectStartDate"), "Start date is required");
      isValid = false;
    }
    if (!isCurrentProject && !endDate) {
      this.showFieldError(document.getElementById("projectEndDate"), "End date is required for completed projects");
      isValid = false;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      this.showFieldError(document.getElementById("projectEndDate"), "End date cannot be before start date");
      isValid = false;
    }
    if (!isValid) {
      return;
    }

    const project = {
      id: Date.now(),
      title: title,
      url: document.getElementById("projectUrl").value.trim(),
      startDate: startDate,
      endDate: isCurrentProject ? "Present" : endDate,
      description: description,
      technologies: document
        .getElementById("projectTechnologies")
        .value.trim()
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)
    };

    this.formData.projects.push(project);
    this.renderProjects();
    this.showToast("Project added successfully!", "success");

    const modal = bootstrap.Modal.getInstance(document.getElementById("projectModal"));
    if (modal) {
      modal.hide();
    }
  }

  renderProjects() {
    const projectsList = document.getElementById("projectsList");
    if (!projectsList) return;

    if (this.formData.projects.length === 0) {
      projectsList.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="ph-duotone ph-briefcase f-40"></i>
          <p class="mt-2">No projects added yet. Click "Add Project" to get started.</p>
        </div>
      `;
      return;
    }

    projectsList.innerHTML = `
      <div class="row">
        ${this.formData.projects
          .map(
            (project) => `
          <div class="col-md-6 mb-4">
            <div class="project-card h-100">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <h5>${project.title}</h5>
                  ${
                    project.url
                      ? `<a href="${project.url}" target="_blank" class="text-primary small">View Project</a>`
                      : ""
                  }
                  <div class="project-meta">
                    ${
                      project.startDate
                        ? new Date(project.startDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long"
                          })
                        : ""
                    }
                    ${project.startDate && project.endDate ? " - " : ""}
                    ${
                      project.endDate === "Present"
                        ? "Present"
                        : project.endDate
                        ? new Date(project.endDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long"
                          })
                        : ""
                    }
                  </div>
                  <div class="project-description">${project.description}</div>
                  ${
                    project.technologies.length > 0
                      ? `
                    <div class="project-technologies mt-2">
                      ${project.technologies.map((tech) => `<span class="tech-tag">${tech}</span>`).join("")}
                    </div>
                  `
                      : ""
                  }
                </div>
                <div class="project-actions">
                  <button type="button" class="btn btn-sm btn-outline-danger remove-project-btn" data-project-id="${project.id}">
                    <i class="ph-duotone ph-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
    this.attachProjectRemoveListeners();
  }

  attachProjectRemoveListeners() {
    const projectsList = document.getElementById("projectsList");
    if (!projectsList) return;
    projectsList.querySelectorAll(".remove-project-btn").forEach((btn) => {
      btn.removeEventListener("click", this.handleProjectRemoveClick);
      btn.addEventListener("click", this.handleProjectRemoveClick.bind(this));
    });
  }

  handleProjectRemoveClick(e) {
    const btn = e.currentTarget;
    const projectId = btn.dataset.projectId;
    if (!projectId) return;
    this.removeProject(projectId);
  }

  removeProject(projectId) {
    this.formData.projects = this.formData.projects.filter((p) => p.id !== Number(projectId));
    this.renderProjects();
    this.showToast("Project removed successfully!", "success");
  }

  updateFinishButton() {
    const termsCheck = document.getElementById("termsCheck");
    const submitBtn = document.getElementById("submitProfile");
    if (!submitBtn || !termsCheck) return;
    submitBtn.disabled = !termsCheck.checked;
  }

  updateProfileSummary() {
    const summary = document.getElementById("profileSummary");
    if (!summary) return;

    const data = this.formData;
    const hasPersonalInfo = data.personalInfo && (data.personalInfo.fullName || data.personalInfo.phoneNumber);
    const hasCredentials = data.credentials && (data.credentials.skills?.length > 0 || data.credentials.certifications?.length > 0);
    const hasProjects = data.projects && data.projects.length > 0;

    if (!hasPersonalInfo && !hasCredentials && !hasProjects) {
      summary.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="ph-duotone ph-user f-40"></i>
          <p class="mt-2">Complete all steps to see your profile summary here.</p>
        </div>
      `;
      return;
    }

    summary.innerHTML = `
      <h6><i class="ph-duotone ph-user"></i> Personal Information</h6>
      <p><strong>Name:</strong> ${data.personalInfo.fullName || "Not provided"}</p>
      ${
        data.personalInfo.email
          ? `<p><strong>Email:</strong> ${data.personalInfo.email}</p>`
          : ""
      }
      <p><strong>Phone:</strong> ${data.personalInfo.phoneNumber || "Not provided"}</p>
      <p><strong>Documents:</strong> ${(data.personalInfo.documents || []).length} file(s) uploaded</p>
      
      <h6 class="mt-3"><i class="ph-duotone ph-certificate"></i> Credentials</h6>
      <p><strong>Skills:</strong> ${(data.credentials.skills || []).join(", ") || "None selected"}</p>
      <p><strong>Certifications:</strong> ${(data.credentials.certifications || []).length} file(s) uploaded</p>
      
      <h6 class="mt-3"><i class="ph-duotone ph-briefcase"></i> Projects</h6>
      <p><strong>Total Projects:</strong> ${data.projects.length}</p>
      ${data.projects.map((project) => `<p>• ${project.title}</p>`).join("")}
    `;
  }

  clearForm() {
    this.formData = {
      personalInfo: {},
      credentials: {},
      projects: []
    };

    document
      .querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="date"], textarea'
      )
      .forEach((field) => {
        field.value = "";
        this.clearFieldError(field);
      });

    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = false;
    });

    const uploadedFiles = document.getElementById("uploadedFiles");
    if (uploadedFiles) {
      uploadedFiles.innerHTML = "";
    }
    const uploadedCerts = document.getElementById("uploadedCertifications");
    if (uploadedCerts) {
      uploadedCerts.innerHTML = "";
    }
    const selectedSkills = document.getElementById("selectedSkills");
    if (selectedSkills) {
      selectedSkills.innerHTML = "";
    }

    this.renderProjects();

    const summary = document.getElementById("profileSummary");
    if (summary) {
      summary.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="ph-duotone ph-user f-40"></i>
          <p class="mt-2">Complete all steps to see your profile summary here.</p>
        </div>
      `;
    }

    this.currentStep = 0;
    this.updateUI();

    const submitBtn = document.getElementById("submitProfile");
    if (submitBtn) {
      submitBtn.disabled = true;
    }
  }

  submitProfile() {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.saveCurrentStepData();

    const submitBtn = document.getElementById("submitProfile");
    if (!submitBtn) return;
    const originalText = submitBtn.textContent;
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';

    setTimeout(() => {
      this.showToast(
        "Profile submitted successfully! Redirecting to first step...",
        "success"
      );

      console.log("Form Data:", this.formData);

      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      setTimeout(() => {
        this.clearForm();
        this.showToast("Form has been reset. You can start over!", "success");
      }, 2000);
    }, 2000);
  }

  goToStep(step) {
    if (step < 0 || step >= this.totalSteps) return;

    // Before moving forward, validate previous steps
    if (step > this.currentStep) {
      for (let i = 0; i < step; i++) {
        if (!this.validateStep(i)) {
          this.showToast(`Please complete step ${i + 1} before proceeding`, "warning");
          return;
        }
      }
    }

    // Save current step data, in case user goes forward from here
    this.saveCurrentStepData();
    this.currentStep = step;
    this.updateUI();

    // If user clicked backwards, restore data
    this.restoreStepData();
  }

  updateUI() {
    const progressBar = document.querySelector(".progress-bar");
    if (progressBar) {
      const progressPercentage = ((this.currentStep + 1) / this.totalSteps) * 100;
      progressBar.style.width = `${progressPercentage}%`;
    }

    document.querySelectorAll(".nav-link").forEach((tab, index) => {
      tab.classList.remove("active");
      if (index === this.currentStep) {
        tab.classList.add("active");
      }
    });

    document.querySelectorAll(".tab-pane").forEach((pane, index) => {
      pane.classList.remove("show", "active");
      if (index === this.currentStep) {
        pane.classList.add("show", "active");
      }
    });

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const finishBtn = document.getElementById("finishBtn");

    if (prevBtn) {
      prevBtn.style.display = this.currentStep === 0 ? "none" : "block";
    }
    if (nextBtn) {
      nextBtn.style.display = this.currentStep === this.totalSteps - 1 ? "none" : "block";
    }
    if (finishBtn) {
      finishBtn.style.display = this.currentStep === this.totalSteps - 1 ? "block" : "none";
    }

    if (this.currentStep === this.totalSteps - 1) {
      this.updateProfileSummary();
    }

    // Re-attach project-remove listeners in case they changed
    this.attachProjectRemoveListeners();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.wizard = new WizardForm();
});
