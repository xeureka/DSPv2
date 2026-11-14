import {
	ArrowDown,
	ArrowUpRight,
	Buildings,
	Check,
	Clock,
	EnvelopeSimple,
	MapPin,
	ShieldCheck,
	Truck,
	User,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

/** Illustrative workflow data, intentionally independent of auth and backend state. */
export function DispatchOperationsVisual() {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const updateVisibility = () =>
			setVisible(document.visibilityState === "visible");
		updateVisibility();
		document.addEventListener("visibilitychange", updateVisibility);
		return () =>
			document.removeEventListener("visibilitychange", updateVisibility);
	}, []);

	return (
		<section
			className="dispatch-operations-visual"
			aria-label="Illustrative dispatch workflow"
		>
			<header className="dispatch-operations-visual__intro">
				<div className="dispatch-operations-visual__kicker">
					<span
						className="dispatch-operations-visual__kicker-dot"
						aria-hidden="true"
					/>
					FIELD OPERATIONS
				</div>
				<h1>Intelligent dispatch. Every request accounted for.</h1>
				<p>From service request to resolution, with every SLA protected.</p>
			</header>

			<div
				className={`dispatch-operations-canvas ${visible ? "" : "is-paused"}`}
				aria-hidden="true"
			>
				<div className="dispatch-operations-canvas__topline">
					<span>ILLUSTRATIVE WORKFLOW</span>
					<span className="dispatch-operations-canvas__cycle-dot" />
				</div>
				<svg
					className="dispatch-operations-map"
					viewBox="0 0 760 390"
					preserveAspectRatio="none"
				>
					<path
						className="ops-map-line"
						d="M105 270 C170 205 215 206 286 145 S408 110 468 181 S595 250 680 128"
					/>
					<path
						className="ops-map-line ops-map-line--secondary"
						d="M83 122 C164 157 205 310 324 286 S492 230 570 302"
					/>
					<path
						className="ops-route ops-route--candidate"
						d="M150 300 C225 240 301 220 398 196"
					/>
					<path
						className="ops-route ops-route--candidate ops-route--candidate-two"
						d="M560 286 C500 256 460 225 398 196"
					/>
					<path
						className="ops-route ops-route--selected"
						d="M150 300 C225 240 301 220 398 196"
					/>
					<path
						className="ops-route ops-route--revised"
						d="M560 286 C505 276 465 230 398 196"
					/>
					<path
						className="ops-route ops-route--incoming"
						d="M398 196 C342 165 312 138 290 102"
					/>
				</svg>

				<div className="ops-building ops-building--a">
					<Buildings size={16} />
					<span>Tower A</span>
				</div>
				<div className="ops-building ops-building--b">
					<Buildings size={16} />
					<span>Tower B</span>
					<i />
				</div>
				<div className="ops-building ops-building--c">
					<Buildings size={16} />
					<span>North block</span>
				</div>

				<div className="ops-engine">
					<span>
						<ShieldCheck size={18} weight="duotone" />
					</span>
					<small>Dispatch engine</small>
				</div>

				<div className="ops-technician ops-technician--one">
					<User size={15} />
					<span>01</span>
				</div>
				<div className="ops-technician ops-technician--two">
					<User size={15} />
					<span>02</span>
				</div>
				<div className="ops-technician ops-technician--three">
					<User size={15} />
					<span>03</span>
					<i />
				</div>

				<div className="ops-card ops-request-card">
					<div className="ops-card__icon ops-card__icon--urgent">
						<EnvelopeSimple size={15} />
					</div>
					<div>
						<strong>Elevator service request</strong>
						<small>Tower B · Priority: High</small>
					</div>
					<span className="ops-card__state">Analyzing</span>
				</div>
				<div className="ops-card ops-sla-card">
					<div className="ops-card__icon ops-card__icon--blue">
						<Clock size={15} />
					</div>
					<div>
						<strong>Gold contract · 4h response</strong>
						<small>SLA verified</small>
					</div>
					<span className="ops-card__check">
						<Check size={12} />
					</span>
				</div>
				<div className="ops-card ops-assignment-card">
					<div className="ops-card__icon ops-card__icon--green">
						<Truck size={15} />
					</div>
					<div>
						<strong>Technician matched</strong>
						<small>Skill verified · ETA: 11 min</small>
					</div>
					<span className="ops-card__check">
						<Check size={12} />
					</span>
				</div>
				<div className="ops-card ops-delay-card">
					<div className="ops-card__icon ops-card__icon--amber">
						<ArrowUpRight size={15} />
					</div>
					<div>
						<strong>Delay detected · +25 min</strong>
						<small>1 job reassigned · 0 SLA breaches</small>
					</div>
					<span className="ops-card__state ops-card__state--amber">
						Plan approved
					</span>
				</div>
				<div className="ops-card ops-resolved-card">
					<div className="ops-card__icon ops-card__icon--success">
						<Check size={15} />
					</div>
					<div>
						<strong>Service completed</strong>
						<small>Response logged · SLA protected</small>
					</div>
					<span className="ops-card__check">
						<Check size={12} />
					</span>
				</div>

				<div className="ops-timeline">
					<span className="ops-timeline__title">ACTIVITY TIMELINE</span>
					<div className="ops-timeline__item">
						<i />
						<span>Request structured</span>
						<small>now</small>
					</div>
					<div className="ops-timeline__item ops-timeline__item--later">
						<i />
						<span>Assignment confirmed</span>
						<small>—</small>
					</div>
					<div className="ops-timeline__item ops-timeline__item--last">
						<i />
						<span>Response logged</span>
						<small>—</small>
					</div>
				</div>
			</div>

			<div className="dispatch-operations-visual__legend">
				<span>
					<MapPin size={13} /> Buildings
				</span>
				<span>
					<Truck size={13} /> Technicians
				</span>
				<span>
					<ArrowDown size={13} /> Protected SLA
				</span>
			</div>
		</section>
	);
}
