class WizardForm {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 4;
    this.sessionId = null;
    this.apiBaseUrl = 'http://localhost:3000/api';
    this.formData = {
      personalInfo: {},
      credentials: {},
      projects: [],
    };

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupDropzones();
    this.setupSkillsSelector();
    this.createToastContainer();
    
    // Initialize session or retrieve existing one
    await this.initializeSession();
    
    this.updateUI();
  }

  async initializeSession() {
    try {
      // Check if we have a session ID in localStorage
      const existingSessionId = localStorage.getItem('wizardSessionId');
      
      if (existingSessionId) {
        // Try to retrieve existing session
        const response = await fetch(`${this.apiBaseUrl}/session/${existingSessionId}`);
        const result = await response.json();
        
        if (result.success) {
          this.sessionId = existingSessionId;
          this.loadSessionData(result.data);
          this.showToast('Previous session restored!', 'success');
          return;
        }
      }
      
      // Create new session
      const response = await fetch(`${this.apiBaseUrl}/init-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.sessionId = result.sessionId;
        localStorage.setItem('wizardSessionId', this.sessionId);
        this.showToast('New session initialized!', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      this.showToast('Failed to initialize session. Please refresh the page.', 'danger');
    }
  }

  loadSessionData(sessionData) {
    this.currentStep = sessionData.currentStep || 0;
    this.formData = {
      personalInfo: sessionData.personalInfo || {},
      credentials: sessionData.credentials || {},
      projects: sessionData.projects || []
    };
    
    // Populate form fields with loaded data
    this.populateFormFields();
  }

  populateFormFields() {
    // Populate personal info
    if (this.formData.personalInfo) {
      const { fullName, email, phoneNumber, documents } = this.formData.personalInfo;
      
      if (fullName) document.getElementById('fullName').value = fullName;
      if (email) document.getElementById('email').value = email;
      if (phoneNumber) document.getElementById('phoneNumber').value = phoneNumber;
      
      // Display uploaded documents
      if (documents && documents.length > 0) {
        this.displayUploadedFiles(documents, 'uploadedFiles');
      }
    }
    
    // Populate credentials
    if (this.formData.credentials) {
      const { skills, certifications } = this.formData.credentials;
      
      // Restore selected skills
      if (skills && skills.length > 0) {
        skills.forEach(skill => {
          this.addSkillTag(skill);
          const checkbox = document.querySelector(`#skillsList input[value="${skill}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
      
      // Display uploaded certifications
      if (certifications && certifications.length > 0) {
        this.displayUploadedFiles(certifications, 'uploadedCertifications');
      }
    }
    
    // Populate projects
    if (this.formData.projects && this.formData.projects.length > 0) {
      this.renderProjects();
    }
  }

  displayUploadedFiles(files, containerId) {
    const container = document.getElementById(containerId);
    
    files.forEach(file => {
      const fileElement = document.createElement("span");
      fileElement.className = "uploaded-file";
      fileElement.innerHTML = `
        <i class="ph-duotone ph-file me-1"></i>
        ${file.originalName || file.filename} 
        <small class="text-muted">(${this.formatFileSize(file.size)})</small>
        <button type="button" class="remove-file">×</button>
      `;

      fileElement
        .querySelector(".remove-file")
        .addEventListener("click", () => {
          fileElement.remove();
        });

      container.appendChild(fileElement);
    });
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
            <i class="ph-duotone ${
              type === "success" ? "ph-check-circle" : "ph-warning-circle"
            } me-2"></i>
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
      delay: 4000,
    });

    toast.show();

    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove();
    });
  }

  setupEventListeners() {
    document.getElementById("nextBtn").addEventListener("click", () =>
      this.nextStep()
    );
    document.getElementById("prevBtn").addEventListener("click", () =>
      this.prevStep()
    );
    document.getElementById("firstBtn").addEventListener("click", () =>
      this.goToStep(0)
    );
    document.getElementById("finishBtn").addEventListener("click", () =>
      this.goToStep(3)
    );

    document.querySelectorAll(".nav-link").forEach((tab, index) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        if (index < this.totalSteps) {
          this.goToStep(index);
        }
      });
    });

    document.getElementById("addProjectBtn").addEventListener("click", () =>
      this.openProjectModal()
    );
    document.getElementById("saveProjectBtn").addEventListener("click", () =>
      this.saveProject()
    );

    document
      .getElementById("phoneNumber")
      .addEventListener("input", (e) => this.validatePhoneNumber(e));
    document.getElementById("termsCheck").addEventListener("change", () =>
      this.updateFinishButton()
    );
    document.getElementById("submitProfile").addEventListener("click", () =>
      this.submitProfile()
    );

    document.getElementById("fullName").addEventListener("input", (e) =>
      this.validateField(e.target, "required")
    );
    document.getElementById("phoneNumber").addEventListener("input", (e) =>
      this.validatePhoneNumber(e)
    );

    const emailField = document.getElementById("email");
    if (emailField) {
      emailField.addEventListener("input", (e) => this.validateEmail(e));
    }

    document.getElementById("currentProject").addEventListener("change", (e) => {
      const endDateInput = document.getElementById("projectEndDate");
      endDateInput.disabled = e.target.checked;
      if (e.target.checked) {
        endDateInput.value = "";
      }
    });
  }

  validateField(field, validationType) {
    const value = field.value.trim();
    let isValid = true;
    let message = "";

    switch (validationType) {
      case "required":
        isValid = value !== "";
        message = `${
          field.getAttribute("data-label") || "This field"
        } is required`;
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

    const certDropzone = document.getElementById("certificationDropzone");
    const certInput = document.getElementById("certificationFiles");

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

  setupSkillsSelector() {
    const skillsCheckboxes = document.querySelectorAll(
      '#skillsList input[type="checkbox"]'
    );
    const selectedSkillsContainer = document.getElementById("selectedSkills");

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

    // Prevent duplicate tags
    if (
      selectedSkillsContainer.querySelector(`[data-skill="${skill}"]`) !== null
    ) {
      return;
    }

    const skillTag = document.createElement("span");
    skillTag.className = "skill-tag";
    skillTag.setAttribute("data-skill", skill);
    skillTag.innerHTML = `
      ${skill}
      <button type="button" class="remove-skill" data-skill="${skill}">×</button>
    `;

    skillTag
      .querySelector(".remove-skill")
      .addEventListener("click", () => {
        this.removeSkillTag(skill);
        const checkbox = document.querySelector(
          `#skillsList input[value="${skill}"]`
        );
        if (checkbox) checkbox.checked = false;
      });

    selectedSkillsContainer.appendChild(skillTag);
  }

  removeSkillTag(skill) {
    const selectedSkillsContainer = document.getElementById("selectedSkills");
    const skillTag = selectedSkillsContainer.querySelector(
      `[data-skill="${skill}"]`
    );
    if (skillTag) {
      skillTag.remove();
    }
  }

  handleFileUpload(files, containerId) {
    const container = document.getElementById(containerId);
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        this.showToast(
          `File "${file.name}" is not a supported format. Please upload PDF, Word, or Image files.`,
          "warning"
        );
        return;
      }

      if (file.size > maxFileSize) {
        this.showToast(
          `File "${file.name}" is too large. Maximum size allowed is 5MB.`,
          "warning"
        );
        return;
      }

      const fileElement = document.createElement("span");
      fileElement.className = "uploaded-file";
      fileElement.innerHTML = `
        <i class="ph-duotone ph-file me-1"></i>
        ${file.name} <small class="text-muted">(${this.formatFileSize(
        file.size
      )})</small>
        <button type="button" class="remove-file">×</button>
      `;

      fileElement
        .querySelector(".remove-file")
        .addEventListener("click", () => {
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

  validatePhoneNumber = (e) => {
    const value = e.target.value;
    const numbersOnly = value.replace(/\D/g, "");
    e.target.value = numbersOnly;

    if (numbersOnly.length < 11 && numbersOnly.length > 0) {
      this.showFieldError(e.target, "Phone number must be at least 11 digits");
      return false;
    } else if (numbersOnly.length > 15) {
      this.showFieldError(e.target, "Phone number cannot exceed 15 digits");
      return false;
    } else if (value !== numbersOnly) {
      this.showFieldError(e.target, "Phone number should contain only numbers");
      return false;
    } else {
      this.clearFieldError(e.target);
      return true;
    }
  };

  async nextStep() {
    if (await this.validateAndSaveCurrentStep()) {
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
        await this.updateStepInBackend();
        this.updateUI();
        this.showToast("Step completed successfully!", "success");
      }
    }
  }

  async prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      await this.updateStepInBackend();
      this.updateUI();
    }
  }

  async goToStep(step) {
    if (step >= 0 && step < this.totalSteps) {
      let canProceed = true;
      for (let i = 0; i < step; i++) {
        if (!this.validateStep(i)) {
          canProceed = false;
          this.showToast(
            `Please complete step ${i + 1} before proceeding`,
            "warning"
          );
          break;
        }
      }

      if (canProceed || step <= this.currentStep) {
        if (step !== this.currentStep) {
          await this.validateAndSaveCurrentStep();
        }
        this.currentStep = step;
        await this.updateStepInBackend();
        this.updateUI();
      }
    }
  }

  async updateStepInBackend() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/update-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          currentStep: this.currentStep
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to update step:', result.message);
      }
    } catch (error) {
      console.error('Error updating step:', error);
    }
  }

  updateUI() {
    const progressBar = document.querySelector(".progress-bar");
    const progressPercentage = ((this.currentStep + 1) / this.totalSteps) * 100;
    progressBar.style.width = `${progressPercentage}%`;

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

    prevBtn.style.display = this.currentStep === 0 ? "none" : "block";
    nextBtn.style.display =
      this.currentStep === this.totalSteps - 1 ? "none" : "block";
    finishBtn.style.display =
      this.currentStep === this.totalSteps - 1 ? "block" : "none";

    if (this.currentStep === this.totalSteps - 1) {
      this.updateProfileSummary();
    }

    this.attachProjectRemoveListeners();
  }

  attachProjectRemoveListeners() {
    const projectsList = document.getElementById("projectsList");
    projectsList.querySelectorAll(".btn-outline-danger").forEach((btn) => {
      btn.removeEventListener("click", this.handleProjectRemoveClick);
      btn.addEventListener("click", this.handleProjectRemoveClick.bind(this));
    });
  }

  handleProjectRemoveClick(e) {
    const btn = e.currentTarget;
    const projectCard = btn.closest(".project-card");
    if (!projectCard) return;

    const title = projectCard.querySelector("h5")?.textContent.trim();
    if (!title) return;

    const project = this.formData.projects.find((p) => p.title === title);
    if (project) {
      this.removeProject(project.id);
    }
  }

  async validateAndSaveCurrentStep() {
    if (!this.validateCurrentStep()) {
      return false;
    }

    return await this.saveCurrentStepData();
  }

  validateCurrentStep() {
    return this.validateStep(this.currentStep);
  }

  validateStep(stepIndex) {
    switch (stepIndex) {
      case 0: // Personal Information
        let isValid = true;
        const fullName = document.getElementById("fullName").value.trim();
        const phoneNumber = document.getElementById("phoneNumber").value.trim();
        const emailField = document.getElementById("email");

        if (!fullName) {
          this.showFieldError(
            document.getElementById("fullName"),
            "Full name is required"
          );
          isValid = false;
        }

        if (fullName && fullName.length < 2) {
          this.showFieldError(
            document.getElementById("fullName"),
            "Full name must be at least 2 characters"
          );
          isValid = false;
        }

        if (!phoneNumber) {
          this.showFieldError(
            document.getElementById("phoneNumber"),
            "Phone number is required"
          );
          isValid = false;
        }

        if (
          phoneNumber &&
          (!/^\d+$/.test(phoneNumber) || phoneNumber.length < 10)
        ) {
          this.showFieldError(
            document.getElementById("phoneNumber"),
            "Please enter a valid phone number (at least 10 digits)"
          );
          isValid = false;
        }

        if (emailField && emailField.value.trim()) {
          if (!this.validateEmail({ target: emailField })) {
            isValid = false;
          }
        }

        return isValid;

      case 1: // Credentials
        const selectedSkills = document.querySelectorAll(
          "#selectedSkills .skill-tag"
        );
        if (selectedSkills.length === 0) {
          this.showToast("Please select at least one skill", "warning");
          return false;
        }
        return true;

      case 2: // Projects
        return true;

      case 3: // Finish
        const termsCheck = document.getElementById("termsCheck");
        if (!termsCheck.checked) {
          this.showToast(
            "Please accept the terms and conditions to continue",
            "warning"
          );
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  async saveCurrentStepData() {
    try {
      switch (this.currentStep) {
        case 0:
          return await this.savePersonalInfo();
        case 1:
          return await this.saveCredentials();
        case 2:
          return await this.saveProjects();
        default:
          return true;
      }
    } catch (error) {
      console.error('Error saving step data:', error);
      this.showToast('Failed to save data. Please try again.', 'danger');
      return false;
    }
  }

  async savePersonalInfo() {
    const formData = new FormData();
    formData.append('sessionId', this.sessionId);
    formData.append('fullName', document.getElementById("fullName").value.trim());
    formData.append('email', document.getElementById("email").value.trim());
    formData.append('phoneNumber', document.getElementById("phoneNumber").value.trim());

    // Add uploaded files
    const documentFiles = document.getElementById("documentFiles").files;
    for (let i = 0; i < documentFiles.length; i++) {
      formData.append('documents', documentFiles[i]);
    }

    const response = await fetch(`${this.apiBaseUrl}/save-personal-info`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      this.formData.personalInfo = result.data;
      return true;
    } else {
      this.showToast(result.message || 'Failed to save personal information', 'danger');
      return false;
    }
  }

  async saveCredentials() {
    const formData = new FormData();
    formData.append('sessionId', this.sessionId);
    
    // Add selected skills
    const selectedSkills = Array.from(
      document.querySelectorAll("#selectedSkills .skill-tag")
    ).map((el) => el.getAttribute('data-skill'));
    
    selectedSkills.forEach(skill => {
      formData.append('skills', skill);
    });

    // Add uploaded certification files
    const certificationFiles = document.getElementById("certificationFiles").files;
    for (let i = 0; i < certificationFiles.length; i++) {
      formData.append('certifications', certificationFiles[i]);
    }

    const response = await fetch(`${this.apiBaseUrl}/save-credentials`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      this.formData.credentials = result.data;
      return true;
    } else {
      this.showToast(result.message || 'Failed to save credentials', 'danger');
      return false;
    }
  }

  async saveProjects() {    
    const response = await fetch(`${this.apiBaseUrl}/save-projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        projects: this.formData.projects
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return true;
    } else {
      this.showToast(result.message || 'Failed to save projects', 'danger');
      return false;
    }
  }

  openProjectModal() {
    const modal = new bootstrap.Modal(document.getElementById("projectModal"));
    this.clearProjectForm();
    modal.show();
  }

  clearProjectForm() {
    document.getElementById("projectForm").reset();
    document.getElementById("projectEndDate").disabled = false;
    document.querySelectorAll("#projectModal .is-invalid").forEach((field) => {
      field.classList.remove("is-invalid");
    });
    document
      .querySelectorAll("#projectModal .invalid-feedback")
      .forEach((feedback) => {
        feedback.remove();
      });
  }

  async saveProject() {
    const form = document.getElementById("projectForm");
    const title = document.getElementById("projectTitle").value.trim();
    const description = document
      .getElementById("projectDescription")
      .value.trim();
    const startDate = document.getElementById("projectStartDate").value;
    const endDate = document.getElementById("projectEndDate").value;
    const isCurrentProject = document.getElementById("currentProject").checked;

    let isValid = true;

    if (!title) {
      this.showFieldError(
        document.getElementById("projectTitle"),
        "Project title is required"
      );
      isValid = false;
    }

    if (!description) {
      this.showFieldError(
        document.getElementById("projectDescription"),
        "Project description is required"
      );
      isValid = false;
    }

    if (!startDate) {
      this.showFieldError(
        document.getElementById("projectStartDate"),
        "Start date is required"
      );
      isValid = false;
    }

    if (!isCurrentProject && !endDate) {
      this.showFieldError(
        document.getElementById("projectEndDate"),
        "End date is required for completed projects"
      );
      isValid = false;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      this.showFieldError(
        document.getElementById("projectEndDate"),
        "End date cannot be before start date"
      );
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
        .filter((t) => t),
    };

    this.formData.projects.push(project);
    await this.saveProjects(); // Save to backend immediately
    this.renderProjects();
    this.showToast("Project added successfully!", "success");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("projectModal")
    );
    modal.hide();
  }

  renderProjects() {
    const projectsList = document.getElementById("projectsList");

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
                        ? new Date(
                            project.startDate
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                          })
                        : ""
                    } 
                    ${
                      project.startDate && project.endDate
                        ? " - "
                        : ""
                    }
                    ${
                      project.endDate === "Present"
                        ? "Present"
                        : project.endDate
                        ? new Date(
                            project.endDate
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                          })
                        : ""
                    }
                  </div>
                  <div class="project-description">${project.description}</div>
                  ${
                    project.technologies.length > 0
                      ? `
                      <div class="project-technologies mt-2">
                        ${project.technologies
                          .map(
                            (tech) =>
                              `<span class="tech-tag">${tech}</span>`
                          )
                          .join("")}
                      </div>
                  `
                      : ""
                  }
                </div>
                <div class="project-actions">
                  <button type="button" class="btn btn-sm btn-outline-danger remove-project-btn">
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

    const buttons = projectsList.querySelectorAll(".remove-project-btn");
    buttons.forEach((btn, index) => {
      btn.dataset.projectId = this.formData.projects[index].id;
    });

    this.attachProjectRemoveListeners();
  }

  async removeProject(projectId) {
    this.formData.projects = this.formData.projects.filter(
      (p) => p.id !== Number(projectId)
    );
    await this.saveProjects(); // Save to backend immediately
    this.renderProjects();
    this.showToast("Project removed successfully!", "success");
  }

  updateFinishButton() {
    const termsCheck = document.getElementById("termsCheck");
    const submitBtn = document.getElementById("submitProfile");
    submitBtn.disabled = !termsCheck.checked;
  }

  updateProfileSummary() {
    const summary = document.getElementById("profileSummary");
    const data = this.formData;

    const hasPersonalInfo =
      data.personalInfo &&
      (data.personalInfo.fullName || data.personalInfo.phoneNumber);
    const hasCredentials =
      data.credentials &&
      (data.credentials.skills.length > 0 ||
        data.credentials.certifications.length > 0);
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
      <p><strong>Name:</strong> ${
        data.personalInfo.fullName || "Not provided"
      }</p>
      ${
        data.personalInfo.email
          ? `<p><strong>Email:</strong> ${data.personalInfo.email}</p>`
          : ""
      }
      <p><strong>Phone:</strong> ${
        data.personalInfo.phoneNumber || "Not provided"
      }</p>
      <p><strong>Documents:</strong> ${
        (data.personalInfo.documents || []).length
      } file(s) uploaded</p>
      
      <h6 class="mt-3"><i class="ph-duotone ph-certificate"></i> Credentials</h6>
      <p><strong>Skills:</strong> ${
        (data.credentials.skills || []).join(", ") || "None selected"
      }</p>
      <p><strong>Certifications:</strong> ${
        (data.credentials.certifications || []).length
      } file(s) uploaded</p>
      
      <h6 class="mt-3"><i class="ph-duotone ph-briefcase"></i> Projects</h6>
      <p><strong>Total Projects:</strong> ${data.projects.length}</p>
      ${data.projects
        .map((project) => `<p>• ${project.title}</p>`)
        .join("")}
    `;
  }

  async clearForm() {
    // Clear session from localStorage
    localStorage.removeItem('wizardSessionId');
    
    this.formData = {
      personalInfo: {},
      credentials: {},
      projects: [],
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

    document.getElementById("uploadedFiles").innerHTML = "";
    document.getElementById("uploadedCertifications").innerHTML = "";
    document.getElementById("selectedSkills").innerHTML = "";
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

    // Initialize new session
    await this.initializeSession();
  }

  async submitProfile() {
    if (!this.validateCurrentStep()) {
      return;
    }

    const submitBtn = document.getElementById("submitProfile");
    const originalText = submitBtn.textContent;
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';

    try {
      const response = await fetch(`${this.apiBaseUrl}/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });

      const result = await response.json();

      if (result.success) {
        this.showToast(
          "Profile submitted successfully! Redirecting to first step...",
          "success"
        );

        console.log("Completed Profile Data:", result.data);

        setTimeout(() => {
          this.clearForm();
          this.showToast("Form has been reset. You can start over!", "success");
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      this.showToast('Failed to submit profile. Please try again.', 'danger');
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.wizard = new WizardForm();
});