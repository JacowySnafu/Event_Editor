import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from './firebase'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Spinner, Form, Modal } from 'react-bootstrap';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    day: '',
    month: '',
    year: '',
    type: '',
    image: '',
    website: '',
    mail: '',
    instagram: ''
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsCollection = collection(db, 'events');
        const eventSnapshot = await getDocs(eventsCollection);
        const eventData = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventData);
        setLoading(false);
      } catch (err) {
        setError("Error fetching events");
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const newEventRef = await addDoc(collection(db, 'events'), eventData);
      setEvents([...events, { id: newEventRef.id, ...eventData }]);
      setEventData({
        name: '',
        description: '',
        day: '',
        month: '',
        year: '',
        type: '',
        image: '',
        website: '',
        mail: '',
        instagram: ''
      });
      setShowModal(false); // Close the modal after adding
    } catch (err) {
      setError("Error adding event");
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents(events.filter(event => event.id !== id));
    } catch (err) {
      setError("Error deleting event");
    }
  };

  const handleUpdateEvent = async (e, id) => {
    e.preventDefault();
    try {
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, eventData);
      setEvents(events.map(event => (event.id === id ? { ...event, ...eventData } : event)));
      setEditingEvent(null);
      setShowModal(false); // Close the modal after updating
    } catch (err) {
      setError("Error updating event");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prevEvent) => ({
      ...prevEvent,
      [name]: value,
    }));
  };

  const handleOpenAddModal = () => {
    setEditingEvent(null); // Make sure editing event is reset
    setEventData({
      name: '',
      description: '',
      day: '',
      month: '',
      year: '',
      type: '',
      image: '',
      website: '',
      mail: '',
      instagram: ''
    }); // Reset eventData state for adding
    setShowModal(true); // Open the modal for adding a new event
  };

  const handleOpenEditModal = (event) => {
    setEditingEvent({ ...event }); // Set the event data for editing
    setEventData({
      name: event.name,
      description: event.description,
      day: event.day,
      month: event.month,
      year: event.year,
      type: event.type,
      image: event.image,
      website: event.website,
      mail: event.mail,
      instagram: event.instagram
    });
    setShowModal(true); // Open the modal for editing
  };

  const formatDate = (day, month, year) => {
    if (!day || !month || !year) {
      return 'Date not available'; // Fallback if any date field is missing
    }
    return `${month} ${day}, ${year}`;
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error) return <div className="text-center text-danger">{error}</div>;

  return (
    <Container>
      <h1 className="text-center my-4">Upcoming Events</h1>
      <Row>
        {events.map((event) => (
          <Col key={event.id} md={4} className="mb-4">
            <Card className="shadow-sm">
              {event.image && event.image !== 'Na' && (
                <Card.Img variant="top" src={event.image} alt={event.name} />
              )}
              <Card.Body>
                <Card.Title>{event.name}</Card.Title>
                <Card.Text>{event.description}</Card.Text>
                <Card.Text>
                  <strong>
                    {formatDate(event.day, event.month, event.year)}
                  </strong>
                </Card.Text>
                <Card.Text>
                  {event.website && <a href={event.website} target="_blank" rel="noopener noreferrer">Visit Website</a>}
                  {event.mail && <div><strong>Contact:</strong> {event.mail}</div>}
                </Card.Text>
                <div className="d-flex justify-content-between">
                  <div>
                    <Button variant="warning" className="mx-2" onClick={() => handleOpenEditModal(event)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDeleteEvent(event.id)}>Delete</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Add Event Button */}
      <div className="text-center">
        <Button variant="success" onClick={handleOpenAddModal}>Add New Event</Button>
      </div>

      {/* Modal for Add or Edit Event */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingEvent ? "Edit Event" : "Add New Event"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={editingEvent ? (e) => handleUpdateEvent(e, editingEvent.id) : handleAddEvent}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={eventData.name}
                onChange={handleChange}
                name="name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={eventData.description}
                onChange={handleChange}
                name="description"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Day</Form.Label>
              <Form.Control
                type="number"
                value={eventData.day}
                onChange={handleChange}
                name="day"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Month</Form.Label>
              <Form.Control
                type="text"
                value={eventData.month}
                onChange={handleChange}
                name="month"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Year</Form.Label>
              <Form.Control
                type="number"
                value={eventData.year}
                onChange={handleChange}
                name="year"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Control
                type="text"
                value={eventData.type}
                onChange={handleChange}
                name="type"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="text"
                value={eventData.image}
                onChange={handleChange}
                name="image"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Website URL</Form.Label>
              <Form.Control
                type="text"
                value={eventData.website}
                onChange={handleChange}
                name="website"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={eventData.mail}
                onChange={handleChange}
                name="mail"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Instagram</Form.Label>
              <Form.Control
                type="text"
                value={eventData.instagram}
                onChange={handleChange}
                name="instagram"
              />
            </Form.Group>
            <Button variant="primary" type="submit">{editingEvent ? "Update Event" : "Add Event"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default EventsPage;
