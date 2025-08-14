"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  CalendarIcon,
  Clock,
  Send,
  Plus,
  X,
  History,
  Mail,
  ChevronLeft,
  ChevronRight,
  Users,
  Bell,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RequestHistory {
  id: string
  type: string
  task: string
  emails: string[]
  dueDate: string
  priority: string
  createdAt: string
}

export default function AIAssistantForm() {
  const [requestType, setRequestType] = useState("reminder")
  const [formData, setFormData] = useState({
    emails: [""],
    dueDate: "",
    task: "",
    priority: "medium",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState({ hour: 9, minute: 0 })
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const { toast } = useToast()

  const requestTypes = [
    {
      value: "reminder",
      label: "Task Reminder",
      icon: Bell,
      description: "Schedule a reminder for tasks or deadlines",
    },
    {
      value: "meeting",
      label: "Meeting Invitation",
      icon: Calendar,
      description: "Schedule meetings with participants",
    },
    { value: "followup", label: "Follow-up Email", icon: Mail, description: "Send follow-up emails after meetings" },
    {
      value: "invitation",
      label: "Event Invitation",
      icon: Users,
      description: "Invite people to events or gatherings",
    },
  ]

  useEffect(() => {
    const savedHistory = localStorage.getItem("aiAssistantHistory")
    if (savedHistory) {
      setRequestHistory(JSON.parse(savedHistory))
    }
  }, [])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatSelectedDateTime = () => {
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const day = String(selectedDate.getDate()).padStart(2, "0")
    const hour = String(selectedTime.hour).padStart(2, "0")
    const minute = String(selectedTime.minute).padStart(2, "0")
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(newDate)
    setFormData((prev) => ({ ...prev, dueDate: formatSelectedDateTime() }))
    setShowDatePicker(false)
  }

  const handleTimeChange = (type: "hour" | "minute", value: number) => {
    setSelectedTime((prev) => ({ ...prev, [type]: value }))
    setTimeout(() => {
      setFormData((prev) => ({ ...prev, dueDate: formatSelectedDateTime() }))
    }, 0)
    setShowDatePicker(false)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const saveToHistory = (requestData: any) => {
    const newRequest: RequestHistory = {
      id: Date.now().toString(),
      type: requestType,
      task: requestData.task,
      emails: formData.emails.filter((email) => email.trim() !== ""),
      dueDate: requestData.dueDate,
      priority: requestData.priority,
      createdAt: new Date().toISOString(),
    }

    const updatedHistory = [newRequest, ...requestHistory].slice(0, 10)
    setRequestHistory(updatedHistory)
    localStorage.setItem("aiAssistantHistory", JSON.stringify(updatedHistory))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (requestType === "meeting") {
      try {
        const response = await fetch("/api/meeting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: formData.task }),
        })

        if (response.ok) {
          toast({
            title: "Meeting Scheduled",
            description: "The meeting has been successfully scheduled.",
          })
          setFormData({ emails: [""], dueDate: "", task: "", priority: "medium" })
        } else {
          throw new Error("Failed to schedule meeting")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to schedule meeting. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const validEmails = formData.emails.filter((email) => email.trim() !== "")
    if (validEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one email address.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const endpoint = "http://localhost:5000/api/schedule"

      const promises = validEmails.map((email) =>
        fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: requestType,
            task: formData.task,
            dueDate: formData.dueDate,
            userId: email,
            priority: formData.priority,
            participants: requestType === "meeting" ? validEmails : undefined,
          }),
        }),
      )

      const responses = await Promise.all(promises)
      const allSuccessful = responses.every((response) => response.ok)

      if (allSuccessful) {
        saveToHistory({
          task: formData.task,
          dueDate: formData.dueDate,
          priority: formData.priority,
        })

        const actionText =
          requestType === "meeting"
            ? "meetings scheduled"
            : requestType === "followup"
              ? "follow-ups sent"
              : requestType === "invitation"
                ? "invitations sent"
                : "reminders created"

        toast({
          title: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} Success`,
          description: `Successfully ${actionText} for ${validEmails.length} recipient${
            validEmails.length > 1 ? "s" : ""
          }.`,
        })
        setFormData({ emails: [""], dueDate: "", task: "", priority: "medium" })
        setShowDatePicker(false)
      } else {
        throw new Error(`Some ${requestType}s failed to create`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create ${requestType}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.emails]
    newEmails[index] = value
    setFormData((prev) => ({ ...prev, emails: newEmails }))
  }

  const addEmailField = () => {
    setFormData((prev) => ({ ...prev, emails: [...prev.emails, ""] }))
  }

  const removeEmailField = (index: number) => {
    if (formData.emails.length > 1) {
      const newEmails = formData.emails.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, emails: newEmails }))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []
    const today = new Date()

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear()
      const isToday =
        today.getDate() === day &&
        today.getMonth() === currentMonth.getMonth() &&
        today.getFullYear() === currentMonth.getFullYear()

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-110 ${
            isSelected
              ? "bg-primary text-primary-foreground shadow-lg scale-110"
              : isToday
                ? "bg-primary/10 text-primary border-2 border-primary/20"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  const getCurrentRequestType = () => {
    return requestTypes.find((type) => type.value === requestType) || requestTypes[0]
  }

  const getPlaceholderText = () => {
    switch (requestType) {
      case "meeting":
        return "Describe the meeting agenda, duration, and any special requirements..."
      case "followup":
        return "Describe what needs to be followed up on and any action items..."
      case "invitation":
        return "Describe the event details, location, dress code, and what to expect..."
      default:
        return "Describe what you'd like to be reminded about..."
    }
  }

  const getEmailLabel = () => {
    switch (requestType) {
      case "meeting":
        return "Meeting Participants"
      case "followup":
        return "Follow-up Recipients"
      case "invitation":
        return "Event Invitees"
      default:
        return "Email Addresses"
    }
  }

  const getDateLabel = () => {
    switch (requestType) {
      case "meeting":
        return "Meeting Date & Time"
      case "followup":
        return "Follow-up Date"
      case "invitation":
        return "Event Date & Time"
      default:
        return "Due Date & Time"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-in fade-in-0 duration-700">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-in zoom-in-0 duration-500 delay-200">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">AI Executive Assistant</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Automate scheduling, reminders, and follow-ups with intelligent assistance
          </p>

          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="mt-4 animate-in slide-in-from-bottom-4 duration-500 delay-300"
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? "Hide History" : "View History"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm animate-in slide-in-from-left-8 duration-700">
            <CardHeader className="text-center space-y-2 pb-6">
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                AI Assistant Request
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Choose your request type and let AI handle the rest
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Request Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {requestTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setRequestType(type.value)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] ${
                          requestType === type.value
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            className={`w-4 h-4 ${requestType === type.value ? "text-primary" : "text-slate-500"}`}
                          />
                          <span
                            className={`text-sm font-medium ${requestType === type.value ? "text-primary" : "text-slate-700 dark:text-slate-300"}`}
                          >
                            {type.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{type.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {requestType !== "meeting" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {getEmailLabel()}
                    </Label>
                    {formData.emails.map((email, index) => (
                      <div
                        key={index}
                        className="flex gap-2 animate-in slide-in-from-right-4 duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <Input
                          type="email"
                          placeholder={`recipient${index + 1}@email.com`}
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          className="h-11 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                        />
                        {formData.emails.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeEmailField(index)}
                            className="h-11 w-11 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEmailField}
                      className="w-full h-10 border-dashed hover:bg-primary/5 hover:border-primary transition-all duration-200 bg-transparent"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Email
                    </Button>
                  </div>
                )}

                <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {getDateLabel()}
                  </Label>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full h-11 justify-start text-left font-normal border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formData.dueDate ? formatDate(formData.dueDate) : "Select date and time"}
                  </Button>

                  {showDatePicker && (
                    <div className="mt-2 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-lg animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => navigateMonth("prev")}
                          className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => navigateMonth("next")}
                          className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                          <div
                            key={day}
                            className="h-8 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-4">{renderCalendar()}</div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                          Time
                        </Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedTime.hour.toString()}
                            onValueChange={(value) => handleTimeChange("hour", Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, "0")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-slate-500">:</span>
                          <Select
                            value={selectedTime.minute.toString()}
                            onValueChange={(value) => handleTimeChange("minute", Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, "0")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                            {selectedTime.hour.toString().padStart(2, "0")}:
                            {selectedTime.minute.toString().padStart(2, "0")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500 delay-300">
                  <Label htmlFor="priority" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Priority Level
                  </Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500 delay-400">
                  <Label htmlFor="task" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {getCurrentRequestType().label} Details
                  </Label>
                  <Textarea
                    id="task"
                    placeholder={getPlaceholderText()}
                    value={formData.task}
                    onChange={(e) => handleInputChange("task", e.target.value)}
                    required
                    rows={4}
                    className="resize-none border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 disabled:opacity-50 animate-in slide-in-from-bottom-4 duration-500 delay-500 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing Request...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {getCurrentRequestType().label === "Task Reminder"
                        ? "Schedule Reminder"
                        : getCurrentRequestType().label === "Meeting Invitation"
                          ? "Schedule Meeting"
                          : getCurrentRequestType().label === "Follow-up Email"
                            ? "Send Follow-up"
                            : "Send Invitation"}
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showHistory && (
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm animate-in slide-in-from-right-8 duration-700">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Requests
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Your last {requestHistory.length} AI assistant requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No requests yet</p>
                    <p className="text-sm">Create your first request to see history</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {requestHistory.map((request, index) => {
                      const requestTypeInfo =
                        requestTypes.find((type) => type.value === request.type) || requestTypes[0]
                      const Icon = requestTypeInfo.icon

                      return (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 animate-in slide-in-from-bottom-4 duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-primary" />
                              <Badge variant="outline" className="text-xs">
                                {requestTypeInfo.label}
                              </Badge>
                              <Badge
                                variant={
                                  request.priority === "high"
                                    ? "destructive"
                                    : request.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {request.priority}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(request.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
                            {request.task}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {request.emails.map((email, emailIndex) => (
                              <Badge key={emailIndex} variant="outline" className="text-xs">
                                {email}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {request.type === "meeting"
                              ? "Meeting"
                              : request.type === "followup"
                                ? "Follow-up"
                                : request.type === "invitation"
                                  ? "Event"
                                  : "Due"}
                            : {formatDate(request.dueDate)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
